import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <h2>Welcome to ERP Dashboard</h2>
      <p *ngIf="auth.user | async as user">Logged in as: {{ user.email }} with org_id: {{ user.org_id }}</p>
      <button (click)="logout()">Logout</button>
    </div>
  `
})
export class DashboardComponent {
  constructor(public auth: AuthService) {}

  logout() {
    this.auth.logout().subscribe();
  }
}
