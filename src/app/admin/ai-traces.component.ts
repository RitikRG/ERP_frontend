import { Component, OnInit } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminPanelService } from './admin-panel.service';

@Component({
  selector: 'app-admin-ai-traces',
  standalone: true,
  imports: [CommonModule, FormsModule, JsonPipe],
  template: `
    <section class="page">
      <header class="page-header">
        <p class="eyebrow">Admin Module</p>
        <h1>AI Trace Explorer</h1>
      </header>

      <div class="filters card">
        <select [(ngModel)]="filters.orgId" name="orgId">
          <option value="">All organisations</option>
          <option *ngFor="let org of organisations" [value]="org._id">{{ org.name }}</option>
        </select>
        <input [(ngModel)]="filters.customerNumber" name="customerNumber" placeholder="Customer number" />
        <input [(ngModel)]="filters.chatSessionId" name="chatSessionId" placeholder="Chat session ID" />
        <select [(ngModel)]="filters.status" name="status">
          <option value="">All statuses</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <input [(ngModel)]="filters.startDate" name="startDate" type="date" />
        <input [(ngModel)]="filters.endDate" name="endDate" type="date" />
        <button type="button" (click)="loadTraces()">Apply</button>
      </div>

      <div class="content-grid">
        <div class="card list-card">
          <div *ngIf="loading" class="state">Loading traces...</div>
          <button
            type="button"
            class="list-item"
            *ngFor="let item of items"
            [class.active]="selectedTrace?._id === item._id"
            (click)="selectTrace(item._id)"
          >
            <div class="item-top">
              <strong>{{ item.customerNumber }}</strong>
              <span class="badge">{{ item.status }}</span>
            </div>
            <p>{{ item.organisationId?.name || 'No organisation' }}</p>
            <small>Turns: {{ item.turnCount }} • {{ item.lastTurnAt | date:'medium' }}</small>
          </button>
          <div *ngIf="!loading && items.length === 0" class="state">No traces found.</div>
        </div>

        <div class="card detail-card">
          <div *ngIf="!selectedTrace" class="state">Select a trace to inspect turns.</div>
          <ng-container *ngIf="selectedTrace">
            <h2>{{ selectedTrace.customerNumber }}</h2>
            <p><strong>Organisation:</strong> {{ selectedTrace.organisationId?.name || 'n/a' }}</p>
            <p><strong>Chat Session:</strong> {{ selectedTrace.chatSessionId }}</p>
            <p><strong>Status:</strong> {{ selectedTrace.status }}</p>

            <article class="turn-card" *ngFor="let turn of turns">
              <header>
                <strong>Turn {{ turn.sequenceNumber }}</strong>
                <span>{{ turn.status }}</span>
              </header>
              <p><strong>Transcript:</strong> {{ turn.resolvedTranscript || 'n/a' }}</p>
              <p><strong>Provider:</strong> {{ turn.provider || 'n/a' }} / {{ turn.model || 'n/a' }}</p>
              <p><strong>Finish Reason:</strong> {{ turn.finishReason || 'n/a' }}</p>
              <p><strong>Latency:</strong> {{ turn.latencyMs ?? 'n/a' }}</p>
              <details>
                <summary>Inbound / Outbound</summary>
                <pre>{{ { inbound: turn.normalizedInboundPayload, outbound: turn.outboundReply } | json }}</pre>
              </details>
              <details>
                <summary>Iterations</summary>
                <pre>{{ turn.iterations | json }}</pre>
              </details>
              <details *ngIf="turn.repairInstructions?.length">
                <summary>Repair Instructions</summary>
                <pre>{{ turn.repairInstructions | json }}</pre>
              </details>
              <details>
                <summary>Session Snapshots</summary>
                <pre>{{ { before: turn.sessionSnapshotBefore, after: turn.sessionSnapshotAfter } | json }}</pre>
              </details>
            </article>
          </ng-container>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .page{display:grid;gap:1rem}.page-header h1{margin:.25rem 0 0}.eyebrow{margin:0;color:#6c7a89;font-weight:700;text-transform:uppercase;font-size:.78rem;letter-spacing:.08em}
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
      .turn-card{margin-top:1rem;padding:1rem;border:1px solid #d9e2ec;border-radius:.9rem;background:#f8fafc}
      .turn-card header{display:flex;justify-content:space-between;gap:1rem}
      .turn-card pre{white-space:pre-wrap;word-break:break-word;background:#0f172a;color:#e2e8f0;padding:1rem;border-radius:.85rem;overflow:auto}
      .state{color:#64748b}
      @media (max-width:1100px){.filters{grid-template-columns:repeat(2,minmax(0,1fr))}.content-grid{grid-template-columns:1fr}}
    `,
  ],
})
export class AiTracesComponent implements OnInit {
  organisations: any[] = [];
  items: any[] = [];
  selectedTrace: any = null;
  turns: any[] = [];
  loading = false;
  filters = {
    orgId: '',
    customerNumber: '',
    chatSessionId: '',
    status: '',
    startDate: '',
    endDate: '',
    page: '1',
    limit: '30',
  };

  constructor(private adminPanel: AdminPanelService) {}

  ngOnInit() {
    this.adminPanel.getOrganisations().subscribe((res) => (this.organisations = res.organisations));
    this.loadTraces();
  }

  loadTraces() {
    this.loading = true;
    this.selectedTrace = null;
    this.turns = [];
    this.adminPanel.getAiTraces(this.filters).subscribe({
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

  selectTrace(id: string) {
    this.adminPanel.getAiTrace(id).subscribe((res) => {
      this.selectedTrace = res.trace;
      this.turns = res.turns;
    });
  }
}
