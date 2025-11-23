import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPrint, faAdd, faTrash } from '@fortawesome/free-solid-svg-icons';

import { AuthService } from '../../auth/auth.service';
import { HeaderComponent } from '../../partials/header/header.component';
import { ToastService } from '../../services/toast.service';
import { SaleService } from './sale.service';

declare var Razorpay: any;

@Component({
  selector: 'sale-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    FontAwesomeModule,
    CurrencyPipe,
    DatePipe,
    NgIf,
    NgFor
  ],
  templateUrl: './saleList.component.html',
  styleUrls: ['./sale.css'],
})
export class SaleListComponent implements OnInit {

  faPrint = faPrint;
  faAdd = faAdd;
  faTrash = faTrash;

  currentOrg: any = null;

  sales: any[] = [];
  filteredSales: any[] = [];
  paginatedSales: any[] = [];

  loading = true;
  errorMessage = '';
  searchTerm = '';

  // Pagination
  page = 1;
  pageSize = 10;
  pageSizes = [5, 10, 25, 50];

  // Sale Details Popup
  selectedSale: any = null;
  showDetailsPopup = false;

  // Payment Popup
  showPaymentPopup = false;
  selectedSaleForPayment: any = null;
  newPayment: any = {
    amount: null,
    payment_method: 'cash',
    transaction_id: '',
    cheque_no: ''
  };

  // Delete
  showDeletePopup = false;
  deleteSaleId: string | null = null;
  deleteSaleRef: string = "";


  constructor(
    private saleService: SaleService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.currentOrg = this.auth.currentUserValue?.org;
    this.fetchSales();
  }

  fetchSales() {
    const orgId = this.auth.currentUserValue?.org_id;

    if (!orgId) {
      this.errorMessage = 'Organisation not found for current user.';
      this.loading = false;
      return;
    }

    // You need a getAllSales(orgId) endpoint in SaleService
    this.saleService.getAllSales(orgId).subscribe({
      next: (res: any) => {
        this.sales = res.sales || [];
        this.filteredSales = [...this.sales];
        this.updatePaginatedSales();
        this.errorMessage = '';
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching sales:', err);
        this.errorMessage = err.error?.message || 'Failed to load sales.';
        this.loading = false;
      }
    });
  }

  // Filter by ref or customer mobile
  filterSales() {
    const term = this.searchTerm.toLowerCase();

    this.filteredSales = this.sales.filter((s) => {
      const ref = String(s.sale_ref || '').toLowerCase();
      const mobile = String(s.customer_id?.mobile_number || '').toLowerCase();
      return ref.includes(term) || mobile.includes(term);
    });

    this.page = 1;
    this.updatePaginatedSales();
  }

  updatePaginatedSales() {
    const totalPages = this.totalPages();

    if (this.page > totalPages) this.page = totalPages;
    if (this.page < 1) this.page = 1;

    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + Number(this.pageSize);
    this.paginatedSales = this.filteredSales.slice(startIndex, endIndex);
  }

  totalPages() {
    return Math.ceil(this.filteredSales.length / this.pageSize) || 1;
  }

  onPageSizeChange() {
    this.page = 1;
    this.updatePaginatedSales();
  }

  // Due date warning
  isDueSoon(dueDate: string | Date): boolean {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 15;
  }

  getDueDaysMessage(dueDate: string | Date): string {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} left until payment due`;
    } else if (diffDays === 0) {
      return 'Payment due today!';
    } else {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`;
    }
  }

  // Navigation
  navigateToCreate() {
    this.router.navigate(['/sales/add-sale']);
  }

  // Details popup
  openSaleDetails(sale: any) {
    this.selectedSale = sale;
    this.showDetailsPopup = true;
  }

  closeSaleDetails() {
    this.showDetailsPopup = false;
    this.selectedSale = null;
  }

  // Print Sale Invoice
  printSale() {
    const printContents = document.querySelector('.a4-layout')?.innerHTML;

    const printWindow = window.open('', '_blank', 'width=900,height=650');
    printWindow!.document.write(`
      <html>
        <head>
          <title>Sale ${this.selectedSale.sale_ref}</title>
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              background: #fff;
              color: #000;
              -webkit-print-color-adjust: exact;
              margin: 0;
            }
            .a4-layout {
              background: #fff;
              width: 100%;
              border-radius: 10px;
              padding: 25px 30px;
              box-sizing: border-box;
            }
            .details-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;
            }
            .details-header h2 {
              font-size: 1.5rem;
              font-weight: 600;
              margin: 0;
            }
            .invoice-header {
              display: flex;
              justify-content: space-between;
              margin: 15px 0;
            }
            .invoice-header .left, .invoice-header .right {
              width: 48%;
              font-size: 0.9rem;
              line-height: 1.5;
            }
            .invoice-header h3 {
              margin-bottom: 5px;
              font-size: 1.1rem;
            }
            hr {
              margin: 10px 0 15px;
              border: none;
              border-top: 1px solid #ccc;
            }
            .sale-info {
              font-size: 0.9rem;
              margin-bottom: 15px;
            }
            .sale-info p {
              margin: 3px 0;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .items-table th, .items-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              font-size: 0.9rem;
            }
            .items-table th {
              background-color: #f2f4f7;
              font-weight: 600;
            }
            .payment-summary {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
              font-size: 0.9rem;
            }
            .payment-summary th, .payment-summary td {
              padding: 4px 8px;
            }
            .summary-left {
              width: 50%;
            }
            .summary-right {
              width: 45%;
            }
            .no-print {
              display: none !important;
            }
            footer {
              margin-top: 30px;
              font-size: 0.85rem;
              text-align: center;
              color: #555;
            }
          </style>
        </head>
        <body>
          <div class="a4-layout">
            ${printContents}
          </div>
          <footer>
            This is a system-generated sale invoice.
          </footer>
        </body>
      </html>
    `);

    printWindow!.document.close();
    printWindow!.print();
  }

  // Payment Popup
  addPayment(saleId: string) {
    const sale = this.sales.find(s => s._id === saleId);
    this.selectedSaleForPayment = sale;

    this.newPayment = {
      amount: null,
      payment_method: 'cash',
      transaction_id: '',
      cheque_no: ''
    };

    this.showPaymentPopup = true;
  }

  savePayment() {
    const orgId = this.auth.currentUserValue?.org_id;
    if (!orgId || !this.selectedSaleForPayment?._id) return;

    this.saleService
      .addSalePayment(orgId, this.selectedSaleForPayment._id, this.newPayment)
      .subscribe({
        next: (res) => {
          this.toast.showSuccess("Payment added successfully!");
          this.showPaymentPopup = false;
          this.fetchSales();   // refresh list
        },
        error: (err) => {
          this.toast.showError(err.error?.message || "Failed to add payment");
        }
      });
  }

  collectPayment() {
    if (!this.selectedSaleForPayment) return;

    const sale = this.selectedSaleForPayment;

    let amountToPay = Number(this.newPayment.amount || 0);

    if (!amountToPay || amountToPay <= 0) {
      this.toast.showError("Enter a valid amount");
      return;
    }

    const options = {
      key: "rzp_test_Ri763pD7uWDKlT",
      amount: Math.round(amountToPay * 100), // convert to paisa
      currency: "INR",
      name: "Your Business Name",
      description: "Sale Payment",
      theme: { color: "#3f51b5" },

      handler: (response: any) => {
        console.log("Payment success:", response.razorpay_payment_id);

        // Auto-fill payment fields
        this.newPayment= {
          amount: amountToPay,
          payment_method: 'upi',
          transaction_id: response.razorpay_payment_id,
          cheque_no: ''
        };
        this.cdr.detectChanges();

        this.toast.showSuccess("Payment successful — transaction ID auto-filled!");
      },

      prefill: {
        name: sale?.customer_id?.name || "",
        contact: sale?.customer_id?.mobile_number || ""
      },

      method: {
        upi: true,
        card: false,
        netbanking: false,
        wallet: false
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  }

  // Delete functionality
  confirmDelete(id: string) {
    const sale = this.sales.find(s => s._id === id);

    this.deleteSaleId = id;
    this.deleteSaleRef = sale?.sale_ref || "this sale";
    this.showDeletePopup = true;
  }

  deleteSaleNow() {
    if (!this.deleteSaleId) return;
    this.saleService.deleteSale(this.auth.currentUserValue?.org_id??"", this.deleteSaleId)
      .subscribe({
        next: () => {
          this.toast.showSuccess("Sale deleted & stock restored!");
          this.showDeletePopup = false;
          this.fetchSales(); // refresh list
        },
        error: (err) => {
          this.toast.showError(err.error?.message || "Failed to delete sale");
        }
      });
  }


}
