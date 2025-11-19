import { Component, OnInit, ChangeDetectorRef  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService } from './product.service';
import { AuthService } from '../../auth/auth.service';
import { HeaderComponent } from '../../partials/header/header.component';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faExclamationTriangle, faEdit, faTrash, faPrint, faAdd } from '@fortawesome/free-solid-svg-icons';
import { ToastService } from '../../services/toast.service';
import { PurchaseService } from './purchase.service';


@Component({
  selector: 'purchase-list',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FormsModule, FontAwesomeModule],
  templateUrl: './purchaseList.component.html',
  styleUrls: ['./inventory.css'],
})
export class PurchaseListComponent implements OnInit {
  // icons
  faEdit = faEdit;
  faTrash = faTrash;
  faExclamationTriangle = faExclamationTriangle;
  faPrint = faPrint;
  faAdd = faAdd;

  currentOrg: any = null;

  purchases: any[] = [];
  filteredPurchases: any[] = [];
  loading = true;
  errorMessage = '';
  searchTerm = '';

  // Pagination
  page = 1;
  pageSize = 10;  
  pageSizes = [5,10, 25, 50];
  paginatedPurchases: any[] = [];

  // Confirmation popup
  showConfirmPopup = false;
  showConfirmPurchase = 'this purchase';
  selectedPurchaseId: string | null = null;
  selectedStatus: string = 'recieved';

  // Add Payment Popup
  showPaymentPopup = false;
  selectedPurchaseForPayment: any = null;
  newPayment: any = {
    amount: null,
    payment_method: 'cash',
    transaction_id: '',
    cheque_no: ''
  };

  constructor(
    private purchaseService: PurchaseService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
  ) {
  }
  
  
  
  ngOnInit() {
    this.currentOrg = this.auth.currentUserValue?.org;
    this.fetchPurchases();
  }

  fetchPurchases() {
    const orgId = this.auth.currentUserValue?.org_id;
    if (!orgId) {
      this.errorMessage = 'Organisation not found for current user.';
      this.loading = false;
      return;
    }
    
    this.purchaseService.getAllPurchases(orgId).subscribe({
      next: (res) => {
        this.purchases = res.purchases || [];
        console.log(this.purchases);
        this.filteredPurchases = [...this.purchases];
        this.updatePaginatedPurchases();
        this.errorMessage = ''; 
        this.loading = false;
        this.cdr.detectChanges();
        },
      error: (err) => {
        console.error('Error fetching purchases:', err);
        this.errorMessage = err.error?.message || 'Failed to load purchases.';
        this.loading = false;
      },
    });
  }

  filterPurchases() {
    const term = this.searchTerm.toLowerCase();
    this.filteredPurchases = this.purchases.filter((p) => {
      const supplier = String(p.supplier || '').toLowerCase();
      const reference = String(p.payment_ref || '').toLowerCase();
      return supplier.includes(term) || reference.includes(term);
    });
    this.page = 1;
    this.updatePaginatedPurchases();
  }

  updatePaginatedPurchases() {
    const totalPages = this.totalPages();

    // Ensure page number stays valid
    if (this.page > totalPages) {
      this.page = totalPages;
    }
    if (this.page < 1) {
      this.page = 1;
    }

    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + Number(this.pageSize);
    this.paginatedPurchases = this.filteredPurchases.slice(startIndex, endIndex);
  }

  totalPages() {
    return Math.ceil(this.filteredPurchases.length / this.pageSize) || 1;
  }

  onPageSizeChange() {
    this.page = 1;
    this.updatePaginatedPurchases();
  }

  openStatusChangeConfirmation(purchaseId: string, reference:string, supplier:string) {
    this.selectedPurchaseId = purchaseId;
    this.showConfirmPopup = true;
    this.showConfirmPurchase = reference + "(" + supplier + ")";
  }


  // Change purchase status (called after confirming popup)
  changePurchaseStatus(id: string) {
    const orgId = this.auth.currentUserValue?.org_id;

    this.purchaseService.changeStatus(orgId??"", id, this.selectedStatus)
      .subscribe({
        next: (res) => {
          this.toast.showSuccess("Status updated successfully!");
          this.showConfirmPopup = false;
          this.fetchPurchases();  
        },
        error: (err) => {
          this.toast.showError(err.error?.message || "Failed to update status");
          this.showConfirmPopup = false;
        }
      });
  }



  // Barcode scanned handler
  onBarcodeScanned(barcode: string) {
    this.searchTerm= barcode;
    this.filterPurchases();
  }

  navigateToCreate() {
    this.router.navigate(['/inventory/add-purchase']);
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

   // Tooltip message
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

  // Purchase Popup logic
  selectedPurchase: any = null;
  showDetailsPopup = false;

  openPurchaseDetails(purchase: any) {
    this.selectedPurchase = purchase;
    this.showDetailsPopup = true;
  }

  closePurchaseDetails() {
    this.showDetailsPopup = false;
    this.selectedPurchase = null;
  }

  // Print functionality
  printPurchase() {
    const printContents = document.querySelector('.a4-layout')?.innerHTML;

    const printWindow = window.open('', '_blank', 'width=900,height=650');
    printWindow!.document.write(`
      <html>
        <head>
          <title>Purchase ${this.selectedPurchase.purchase_ref}</title>
          <style>
            /* --- Base Page --- */
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

            /* --- Main A4 Layout --- */
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

            /* --- Top Section --- */
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

            /* --- Purchase Info --- */
            .purchase-info {
              font-size: 0.9rem;
              margin-bottom: 15px;
            }

            .purchase-info p {
              margin: 3px 0;
            }

            /* --- Table --- */
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

            /* --- Payment Summary --- */
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

            /* --- Hide Print Buttons --- */
            .no-print {
              display: none !important;
            }

            /* --- Footer --- */
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
            This is a system-generated purchase invoice.
          </footer>
        </body>
      </html>
    `);

    printWindow!.document.close();
    printWindow!.print();
  }

  // Add Payment
  addPayment(purchaseId: string) {
    const purchase = this.purchases.find(p => p._id === purchaseId);
    this.selectedPurchaseForPayment = purchase;

    // Reset form
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
    if (!orgId || !this.selectedPurchaseForPayment?._id) return;

    this.purchaseService
      .addPurchasePayment(orgId, this.selectedPurchaseForPayment._id, this.newPayment)
      .subscribe({
        next: (res) => {
          this.toast.showSuccess("Payment added successfully!");
          this.showPaymentPopup = false;
          this.fetchPurchases(); // refresh list
        },
        error: (err) => {
          this.toast.showError(err.error?.message || "Failed to add payment");
        }
      });
  }



}
