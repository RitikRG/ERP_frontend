import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from './product.service';
import { AuthService } from '../../auth/auth.service';
import { HeaderComponent } from '../../partials/header/header.component';
import { ToastService } from '../../services/toast.service';
@Component({
  selector: 'product-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent],
  templateUrl: './editProduct.component.html',
  styleUrls: ['./product.css'],
})
export class EditProductComponent implements OnInit {
  registerForm: any;
  imageFile: File | null = null;
  imagePreview: string | null = null;
  productId: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: ProductService,
    public auth: AuthService,
    private toast: ToastService,
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      p_code: ['', Validators.required],
      img: [''],
      cost: [0, [Validators.required]],
      price: [0, [Validators.required]],
      tax_rate: [0, [Validators.required]],
      tax_type: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id') || '';
    if (this.productId) {
      this.service.getProductById(this.auth.currentUserValue?.org_id || '', this.productId).subscribe({
        next: (data) => {
            data= data.product;
          this.registerForm.patchValue({
            name: data.name,
            p_code: data.p_code,
            cost: data.cost,
            price: data.price,
            tax_rate: data.tax_rate,
            tax_type: data.tax_type,
          });
          if (data.img) {
            this.imagePreview = data.img.startsWith('http')
              ? data.img
              : `${data.baseUrl || ''}/${data.img}`;
          }
        },
        error: (err) => alert(err.error?.message || 'Failed to load product'),
      });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imageFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(e: Event) {
    e.preventDefault();
    if (this.registerForm.invalid) return;

    const formData = new FormData();
    formData.append('org_id', this.auth.currentUserValue?.org_id || '');
    formData.append('name', this.registerForm.value.name || '');
    formData.append('p_code', this.registerForm.value.p_code || '');
    formData.append('cost', this.registerForm.value.cost?.toString() || '');
    formData.append('price', this.registerForm.value.price?.toString() || '');
    formData.append('tax_rate', this.registerForm.value.tax_rate?.toString() || '');
    formData.append('tax_type', this.registerForm.value.tax_type || '');

    if (this.imageFile) {
      formData.append('img', this.imageFile);
    }

    this.service.updateProduct(this.auth.currentUserValue?.org_id || "", this.productId, formData).subscribe({
        next: () => {
            // Show success toast
            this.toast.showSuccess('Product updated successfully!');

            // Wait a short time so user can see the toast, then navigate
            setTimeout(() => {
            this.router.navigate(['/product/list']);
            }, 500);
        },
      error: (err) => alert(err.error?.message || 'Product update failed'),
    });
  }
}
