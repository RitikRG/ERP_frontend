import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from './product.service';
import { AuthService } from '../../auth/auth.service';
import { HeaderComponent } from '../../partials/header/header.component';

@Component({
  selector: 'product-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent],
  templateUrl: './createProduct.component.html',
  styleUrls: ['./product.css'],
})
export class NewProductComponent {
  imageFile: File | null = null;
  imagePreview: string | null = null;

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
  registerForm;
  constructor(private fb: FormBuilder, private router: Router, private service: ProductService, public auth: AuthService) {
    this.registerForm = this.fb.group({
        name: ['', Validators.required],
        p_code: ['', Validators.required],
        img: [''],
        cost: [0, [Validators.required]],
        price: [0, [Validators.required]],
        tax_rate: [0, [Validators.required]],
        tax_type: ['', Validators.required],
        cess: [0, [Validators.required]],
    });
  }


  onSubmit(e: Event) {
    e.preventDefault();
    if (this.registerForm.invalid) return;

    const formData = new FormData();

    console.log('Current user:', this.auth.currentUserValue);
    console.log('Org ID:', this.auth.currentUserValue?.org_id);

    formData.append('org_id', this.auth.currentUserValue?.org_id || '');
    formData.append('name', this.registerForm.value.name||'');
    formData.append('p_code', this.registerForm.value.p_code||'');
    formData.append('cost', this.registerForm.value.cost?.toString()||'');
    formData.append('price', this.registerForm.value.price?.toString()||'');
    formData.append('tax_rate', this.registerForm.value.tax_rate?.toString()||'');
    formData.append('tax_type', this.registerForm.value.tax_type||'');
    formData.append('cess', this.registerForm.value.cess?.toString()||'');

    if (this.imageFile) {
      formData.append('img', this.imageFile);
    }

    this.service.createProduct(formData).subscribe({
      next: () => this.router.navigate(['/product/new']),
      error: err => alert(err.error?.message || 'Product creation failed'),
    });
  }

}
