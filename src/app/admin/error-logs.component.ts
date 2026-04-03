import { Component, OnInit } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminPanelService } from './admin-panel.service';

@Component({
  selector: 'app-admin-error-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, JsonPipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Admin Module</p>
          <h1>Error Logs</h1>
        </div>
      </header>

      <div class="filters card">
        <select [(ngModel)]="filters.orgId" name="orgId">
          <option value="">All organisations</option>
          <option *ngFor="let org of organisations" [value]="org._id">{{ org.name }}</option>
        </select>
        <input [(ngModel)]="filters.source" name="source" placeholder="Source" />
        <select [(ngModel)]="filters.severity" name="severity">
          <option value="">All severities</option>
          <option value="error">Error</option>
          <option value="warn">Warn</option>
          <option value="fatal">Fatal</option>
        </select>
        <input [(ngModel)]="filters.search" name="search" placeholder="Search message or stack" />
        <input [(ngModel)]="filters.startDate" name="startDate" type="date" />
        <input [(ngModel)]="filters.endDate" name="endDate" type="date" />
        <button type="button" (click)="loadLogs()">Apply</button>
      </div>

      <div class="content-grid">
        <div class="card list-card">
          <div *ngIf="loading" class="state">Loading logs...</div>
          <button
            type="button"
            class="list-item"
            *ngFor="let item of items"
            [class.active]="selected?._id === item._id"
            (click)="selectLog(item._id)"
          >
            <div class="item-top">
              <strong>{{ item.source }}</strong>
              <span class="badge">{{ item.severity }}</span>
            </div>
            <p>{{ item.message }}</p>
            <small>{{ item.orgId?.name || 'No organisation' }} • {{ item.createdAt | date:'medium' }}</small>
          </button>
          <div *ngIf="!loading && items.length === 0" class="state">No logs found.</div>
        </div>

        <div class="card detail-card">
          <div *ngIf="!selected" class="state">Select a log to inspect details.</div>
          <ng-container *ngIf="selected">
            <h2>{{ selected.message }}</h2>
            <p><strong>Source:</strong> {{ selected.source }}</p>
            <p><strong>Severity:</strong> {{ selected.severity }}</p>
            <p><strong>Route:</strong> {{ selected.route || 'n/a' }}</p>
            <p><strong>Action:</strong> {{ selected.action || 'n/a' }}</p>
            <p><strong>Created:</strong> {{ selected.createdAt | date:'medium' }}</p>
            <details open>
              <summary>Stack</summary>
              <pre>{{ selected.stack || 'No stack trace captured.' }}</pre>
            </details>
            <details>
              <summary>Request Snapshot</summary>
              <pre>{{ selected.request | json }}</pre>
            </details>
            <details>
              <summary>Metadata</summary>
              <pre>{{ selected.metadata | json }}</pre>
            </details>
          </ng-container>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .page{display:grid;gap:1rem}.page-header h1,.detail-card h2{margin:.25rem 0 0}.eyebrow{margin:0;color:#6c7a89;font-weight:700;text-transform:uppercase;font-size:.78rem;letter-spacing:.08em}
      .card{background:#fff;border:1px solid #d9e2ec;border-radius:1rem;padding:1rem;box-shadow:0 10px 24px rgba(15,23,42,.06)}
      .filters{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:.75rem}
      .filters input,.filters select,.filters button{padding:.8rem .9rem;border:1px solid #cbd5e1;border-radius:.75rem;font:inherit}
      .filters button{background:#1d4ed8;color:#fff;border:0;cursor:pointer}
      .content-grid{display:grid;grid-template-columns:minmax(20rem,30rem) 1fr;gap:1rem}
      .list-card{display:grid;gap:.75rem;align-content:start;max-height:75vh;overflow:auto}
      .list-item{text-align:left;padding:1rem;border:1px solid #d9e2ec;border-radius:.9rem;background:#f8fafc;cursor:pointer}
      .list-item.active{border-color:#1d4ed8;background:#eef4ff}
      .item-top{display:flex;justify-content:space-between;gap:1rem}
      .badge{padding:.2rem .55rem;border-radius:999px;background:#dbeafe;color:#1d4ed8;text-transform:uppercase;font-size:.72rem;font-weight:700}
      .list-item p{margin:.45rem 0;color:#334155}
      .detail-card pre{white-space:pre-wrap;word-break:break-word;background:#0f172a;color:#e2e8f0;padding:1rem;border-radius:.85rem;overflow:auto}
      .state{color:#64748b}
      @media (max-width:1100px){.filters{grid-template-columns:repeat(2,minmax(0,1fr))}.content-grid{grid-template-columns:1fr}}
    `,
  ],
})
export class ErrorLogsComponent implements OnInit {
  organisations: any[] = [];
  items: any[] = [];
  selected: any = null;
  loading = false;
  filters = {
    orgId: '',
    source: '',
    severity: '',
    search: '',
    startDate: '',
    endDate: '',
    page: '1',
    limit: '50',
  };

  constructor(private adminPanel: AdminPanelService) {}

  ngOnInit() {
    this.adminPanel.getOrganisations().subscribe((res) => (this.organisations = res.organisations));
    this.loadLogs();
  }

  loadLogs() {
    this.loading = true;
    this.selected = null;
    this.adminPanel.getErrorLogs(this.filters).subscribe({
      next: (res) => {
        this.loading = false;
        this.items = res.items;
      },
      error: () => {
        this.loading = false;
        this.items = [];
      },
    });
  }

  selectLog(id: string) {
    this.adminPanel.getErrorLog(id).subscribe((res) => (this.selected = res.item));
  }
}
