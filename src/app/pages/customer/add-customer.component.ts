import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { HeaderComponent } from '../../partials/header/header.component';
import { CustomerService } from './customer.service';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'add-customer',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './add-customer.component.html',
  styleUrls: ['./customer.css'],
})
export class AddCustomerComponent {

  customer = {
    name: '',
    mobile_number: ''
  };

  constructor(
    private customerService: CustomerService,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  submit() {
    if (!this.customer.mobile_number) {
      this.toast.showError("Mobile number is required");
      return;
    }

    const org_id = this.auth.currentUserValue?.org_id;

    this.customerService.addCustomer(org_id ?? '', this.customer).subscribe({
      next: () => {
        this.toast.showSuccess("Customer added successfully!");
        setTimeout(() => this.router.navigate(['/customers/list']), 400);
      },
      error: err => {
        this.toast.showError(err.error?.message || "Failed to add customer");
      }
    });
  }
}
