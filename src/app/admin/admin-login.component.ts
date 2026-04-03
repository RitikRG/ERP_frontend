import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-login-shell">
      <form class="admin-login-card" (submit)="onLogin($event)">
        <p class="eyebrow">Platform Admin</p>
        <h1>Admin Sign In</h1>
        <p class="subcopy">Access logs, AI traces, and notification templates.</p>

        <label>
          <span>Email</span>
          <input type="email" [(ngModel)]="email" name="email" required />
        </label>

        <label>
          <span>Password</span>
          <input type="password" [(ngModel)]="password" name="password" required />
        </label>

        <p class="error" *ngIf="error">{{ error }}</p>
        <button type="submit" [disabled]="loading">{{ loading ? 'Signing in...' : 'Login' }}</button>
      </form>
    </div>
  `,
  styles: [
    `
      .admin-login-shell{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;background:linear-gradient(160deg,#13293d,#1f4e5f 55%,#d8f3dc)}
      .admin-login-card{width:min(100%,28rem);display:grid;gap:1rem;padding:2rem;border-radius:1.5rem;background:#ffffffeb;box-shadow:0 20px 60px rgba(0,0,0,.18)}
      .eyebrow{margin:0;color:#3d5a80;font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-size:.8rem}
      h1{margin:0;color:#0b132b}
      .subcopy{margin:0 0 .5rem;color:#4f5d75}
      label{display:grid;gap:.4rem}
      span{font-weight:600;color:#1d3557}
      input{padding:.9rem 1rem;border:1px solid #c7d5e0;border-radius:.85rem;font:inherit}
      button{padding:.95rem 1rem;border:0;border-radius:.85rem;background:#0b6e4f;color:#fff;font-weight:700;cursor:pointer}
      button:disabled{opacity:.7;cursor:wait}
      .error{margin:0;color:#b42318}
    `,
  ],
})
export class AdminLoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(private adminAuth: AdminAuthService, private router: Router) {}

  onLogin(event: Event) {
    event.preventDefault();
    this.error = '';
    this.loading = true;
    this.adminAuth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/admin/error-logs']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Admin login failed';
      },
    });
  }
}
