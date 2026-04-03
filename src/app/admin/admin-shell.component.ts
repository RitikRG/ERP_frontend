import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-shell">
      <aside class="sidebar">
        <div class="brand">
          <p>Platform Admin</p>
          <strong>ERP Control</strong>
        </div>

        <nav>
          <a routerLink="/admin/error-logs" routerLinkActive="active">Error Logs</a>
          <a routerLink="/admin/ai-traces" routerLinkActive="active">AI Traces</a>
          <a routerLink="/admin/notification-templates" routerLinkActive="active">Notification Templates</a>
        </nav>

        <div class="admin-meta">
          <strong>{{ adminAuth.currentAdminValue?.name }}</strong>
          <span>{{ adminAuth.currentAdminValue?.email }}</span>
          <button type="button" (click)="logout()">Logout</button>
        </div>
      </aside>

      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .admin-shell{min-height:100vh;display:grid;grid-template-columns:18rem 1fr;background:#f5f7fb}
      .sidebar{display:flex;flex-direction:column;gap:1.5rem;padding:1.5rem;background:#102542;color:#fff}
      .brand p,.admin-meta span{margin:0;color:#c7d5e0}
      .brand strong,.admin-meta strong{font-size:1.1rem}
      nav{display:grid;gap:.5rem}
      nav a{padding:.85rem 1rem;border-radius:.85rem;color:#e6eef8;text-decoration:none;background:transparent}
      nav a.active,nav a:hover{background:#1f3a5f}
      .admin-meta{margin-top:auto;display:grid;gap:.35rem}
      .admin-meta button{margin-top:.5rem;padding:.8rem 1rem;border:1px solid #5b7496;border-radius:.75rem;background:transparent;color:#fff;cursor:pointer}
      .content{padding:1.5rem}
      @media (max-width:960px){.admin-shell{grid-template-columns:1fr}.sidebar{gap:1rem}.content{padding:1rem}}
    `,
  ],
})
export class AdminShellComponent {
  constructor(public adminAuth: AdminAuthService, private router: Router) {}

  logout() {
    this.adminAuth.logout().subscribe({
      next: () => this.router.navigate(['/admin/login']),
      error: () => this.router.navigate(['/admin/login']),
    });
  }
}
