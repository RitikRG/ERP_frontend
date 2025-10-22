import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  registerForm;
  constructor(private fb: FormBuilder, private router: Router, private auth: AuthService) {
    this.registerForm = this.fb.group({
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
    });
  }


  onSubmit(e: Event) {
    e.preventDefault();
    if (this.registerForm.invalid) return;

    const { name, email, phone, password, confirmPassword } = this.registerForm.value;

    if (!email) {
        alert('Email is required');
        return;
    }

    if (!password) {
        alert('Password is required');
        return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    this.auth.register({
        email: email, 
        password: password, 
        name: name ?? undefined,
        phone: phone ?? undefined
    }).subscribe({
      next: () => this.router.navigate(['/login']),
      error: err => alert(err.error?.message || 'registration failed'),
    });
  }
}
