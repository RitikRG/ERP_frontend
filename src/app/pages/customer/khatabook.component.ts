import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../partials/header/header.component';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../services/toast.service';
import { CustomerService } from '../customer/customer.service';
import { SaleService } from '../sale/sale.service';
import { faPhone } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';


declare var Razorpay: any;

@Component({
  selector: 'khatabook-page',
  standalone: true,
  templateUrl: './khatabook.component.html',
  styleUrls: ['./khatabook.css'],
  imports: [CommonModule, FormsModule, HeaderComponent, CurrencyPipe, DatePipe, FontAwesomeModule]
})
export class KhataBookComponent implements OnInit {

    faPhone = faPhone;

  customers: any[] = [];
  filteredCustomers: any[] = [];
  searchTerm = '';


  // Details popup
  showDetailsPopup = false;
  selectedCustomer: any = null;
  customerSales: any[] = [];

  // Add Payment Popup
  showPaymentPopup = false;
  selectedSaleForPayment: any = null;
  newPayment: any = {
    amount: null,
    payment_method: 'cash',
    transaction_id: '',
    cheque_no: ''
  };

  constructor(
    private auth: AuthService,
    private customerService: CustomerService,
    private saleService: SaleService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.fetchDueCustomers();
  }

  fetchDueCustomers() {
    const org_id = this.auth.currentUserValue?.org_id;
    this.customerService.getDueCustomers(org_id??"").subscribe({
      next: (res: any) => {
        console.log(res.customers);
        this.customers = res.customers;
        this.filteredCustomers = [...this.customers];
        this.cdr.detectChanges();
      },
      error: err => console.error(err)
    });
  }

  search() {
    const term = this.searchTerm.toLowerCase();

    this.filteredCustomers = this.customers.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.mobile_number.includes(term)
    );
  }


  openDetails(customer: any) {
    const org_id = this.auth.currentUserValue?.org_id;

    this.customerService.getCustomerDetails(org_id??"", customer._id).subscribe({
      next: (res: any) => {
        this.selectedCustomer = res.customer;
        this.customerSales = res.sales.filter((s:any) => s.balance_amount > 0);
        this.showDetailsPopup = true;
      }
    });
  }

  openAddPayment(sale: any) {
    this.selectedSaleForPayment = sale;
    this.newPayment = {
      amount: sale.balance_amount,
      payment_method: 'cash',
      transaction_id: '',
      cheque_no: ''
    };
    this.showPaymentPopup = true;
  }

  savePayment() {
    const org_id = this.auth.currentUserValue?.org_id;

    this.saleService.addSalePayment(org_id??'', this.selectedSaleForPayment._id, this.newPayment)
      .subscribe({
        next: () => {
          this.toast.showSuccess("Payment added!");
          this.showPaymentPopup = false;
          this.openDetails(this.selectedCustomer);
          this.fetchDueCustomers();
          this.cdr.detectChanges();
        },
        error: err => this.toast.showError(err.error?.message)
      });
  }

  collectPaymentUPI() {
    const sale = this.selectedSaleForPayment;
    let amount = Number(this.newPayment.amount || 0);

    if (!amount || amount <= 0) {
      this.toast.showError("Enter valid amount");
      return;
    }

    const options = {
      key: "rzp_test_Ri763pD7uWDKlT",
      amount: Math.round(amount * 100),
      currency: "INR",
      name: "Your Business",
      description: "Customer Due Collection",
      theme: { color: "#3f51b5" },

      handler: (response: any) => {
        this.newPayment.transaction_id = response.razorpay_payment_id;
        this.newPayment.payment_method = "upi";

        this.toast.showSuccess("UPI Payment Successful!");

        this.savePayment();
      },

      prefill: {
        name: sale.customer_id?.name || "",
        contact: sale.customer_id?.mobile_number || ""
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

}
