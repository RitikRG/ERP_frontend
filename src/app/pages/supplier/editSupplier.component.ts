import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SupplierService } from './supplier.service';
import { AuthService } from '../../auth/auth.service';
import { HeaderComponent } from '../../partials/header/header.component';
import { ToastService } from '../../services/toast.service';
@Component({
  selector: 'supplier-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent],
  templateUrl: './editSupplier.component.html',
  styleUrls: ['./supplier.css'],
})
export class EditSupplierComponent implements OnInit {
  registerForm: any;
  imageFile: File | null = null;
  imagePreview: string | null = null;
  supplierId: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: SupplierService,
    public auth: AuthService,
    private toast: ToastService,
  ) {
    this.registerForm = this.fb.group({
        name: ['', Validators.required],
        company: ['', Validators.required],
        gst: [''],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id') || '';
    if (this.supplierId) {
      this.service.getSupplierById(this.auth.currentUserValue?.org_id || '', this.supplierId).subscribe({
        next: (data) => {
            data= data.supplier;
          this.registerForm.patchValue({
            name: data.name,
            company: data.company,
            gst: data.gst,
            email: data.email,
            phone: data.phone
          });
        },
        error: (err) => alert(err.error?.message || 'Failed to load Supplier data'),
      });
    }
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

    this.service.updateSupplier(this.auth.currentUserValue?.org_id || "", this.supplierId, payload).subscribe({
        next: () => {
            // Show success toast
            this.toast.showSuccess('Supplier updated successfully!');

            // Wait a short time so user can see the toast, then navigate
            setTimeout(() => {
            this.router.navigate(['/supplier/list']);
            }, 500);
        },
      error: (err) => alert(err.error?.message || 'Supplier update failed'),
    });
  }
}
