import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupplierService } from './supplier.service';
import { AuthService } from '../../auth/auth.service';
import { HeaderComponent } from '../../partials/header/header.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'supplier-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent],
  templateUrl: './createSupplier.component.html',
  styleUrls: ['./supplier.css'],
})
export class NewSupplierComponent {

  registerForm;
  constructor(private fb: FormBuilder, private router: Router, private service: SupplierService, public auth: AuthService, private toast: ToastService) {
    this.registerForm = this.fb.group({
        name: ['', Validators.required],
        company: ['', Validators.required],
        gst: [''],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required]],
    });
  }


  onSubmit(e: Event) {
    e.preventDefault();
    if (this.registerForm.invalid) return;

      const payload = {
      org_id: this.auth.currentUserValue?.org_id || '',
      name: this.registerForm.value.name || '',
      company: this.registerForm.value.company || '',
      gst: this.registerForm.value.gst || '',
      email: this.registerForm.value.email || '',
      phone: this.registerForm.value.phone || 0 
    };

    this.service.createSupplier(payload).subscribe({
        next: () => {
            // Show success toast
            this.toast.showSuccess('Supplier Added successfully!');

            // Wait a short time so user can see the toast, then navigate
            setTimeout(() => {
            this.router.navigate(['/supplier/list']);
            }, 500);
        },
      error: err => alert(err.error?.message || 'Supplier addition failed'),
    });
  }

}
