import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OrgService } from './org.service';

@Component({
  selector: 'org-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class OrgRegisterComponent {
  registerForm;
  constructor(private fb: FormBuilder, private router: Router, private auth: OrgService) {
    this.registerForm = this.fb.group({
        name: ['', Validators.required],
        gst: ['', Validators.required],
        address: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        contact_person_name: ['', [Validators.required]],
        phone: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
    });
  }


  onSubmit(e: Event) {
    e.preventDefault();
    if (this.registerForm.invalid) return;

    const { name, gst, address, contact_person_name, email, phone, password, confirmPassword } = this.registerForm.value;

    if (!name) {
        alert('Company Name is required');
        return;
    }

    if (!email) {
        alert('Email is required');
        return;
    }

    if (!password) {
        alert('Password is required');
        return;
    }

    if (!gst) {
        alert('GST is required');
        return;
    }

    if (!address) {
        alert('Address is required');
        return;
    }
    if (!phone) {
        alert('Phone Number is required');
        return;
    }

    if (!contact_person_name) {
        alert('Contact Person Name is required');
        return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    this.auth.registerOrganisation({
        name: name,
        address: address,
        gst : gst,
        email: email, 
        contact_person_name: contact_person_name,
        password: password, 
        phone: phone,
    }).subscribe({
      next: () => this.router.navigate(['/login']),
      error: err => alert(err.error?.message || 'registration failed'),
    });
  }
}
