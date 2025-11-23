import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from './customer.service';
import { AuthService } from '../../auth/auth.service';
import { HeaderComponent } from '../../partials/header/header.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer.css']
})
export class CustomerListComponent implements OnInit {

  customers: any[] = [];
  searchTerm = '';

  // Edit Popup
  showEditPopup = false;
  selectedCustomer: any = null;
  newName = '';

    // Details popup
    showDetailsPopup = false;
    selectedCustomerDetail: any = null;
    customerSummary: any = null;
    customerSales: any[] = [];


  constructor(
    private customerService: CustomerService,
    private auth: AuthService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchCustomers();
  }

  fetchCustomers() {
    const org_id = this.auth.currentUserValue?.org_id;

    this.customerService.getCustomerList(org_id??"").subscribe({
      next: (res: any) => {
        this.customers = res.customers;
        this.cdr.detectChanges();
      },
      error: err => console.error(err)
    });
  }

  filter() {
    const term = this.searchTerm.toLowerCase();

    return this.customers.filter(c =>
      c.name?.toLowerCase().includes(term) ||
      c.mobile_number?.includes(term)
    );
  }

  openEdit(customer: any) {
    this.selectedCustomer = customer;
    this.newName = customer.name;
    this.showEditPopup = true;
  }

  saveCustomer() {
    const org_id = this.auth.currentUserValue?.org_id;

    this.customerService.updateCustomer(org_id??"", this.selectedCustomer._id, { name: this.newName })
      .subscribe({
        next: () => {
          this.toast.showSuccess("Customer updated");
          this.showEditPopup = false;
          this.fetchCustomers();
          this.cdr.detectChanges();
        },
        error: err => this.toast.showError(err.error?.message)
      });
  }

    // Details popup
    openDetails(customer: any) {
        const org_id = this.auth.currentUserValue?.org_id;

        this.customerService.getCustomerDetails(org_id??"", customer._id).subscribe({
            next: (res: any) => {
            this.selectedCustomerDetail = res.customer;
            this.customerSummary = res.summary;
            this.customerSales = res.sales;

            this.showDetailsPopup = true;
            },
            error: err => {
            this.toast.showError("Failed to load customer details");
            }
        });
    }

}
