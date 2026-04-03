import { Component, OnInit } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminPanelService } from './admin-panel.service';

@Component({
  selector: 'app-admin-notification-templates',
  standalone: true,
  imports: [CommonModule, FormsModule, JsonPipe],
  template: `
    <section class="page">
      <header class="page-header">
        <p class="eyebrow">Admin Module</p>
        <h1>Notification Templates</h1>
      </header>

      <div class="content-grid">
        <div class="card list-card">
          <button
            type="button"
            class="list-item"
            *ngFor="let item of items"
            [class.active]="selected?.type === item.type"
            (click)="selectTemplate(item.type)"
          >
            <strong>{{ item.type }}</strong>
            <small>{{ item.updatedAt | date:'medium' }}</small>
          </button>
        </div>

        <div class="card detail-card">
          <div *ngIf="!selected" class="state">Select a template to edit.</div>
          <ng-container *ngIf="selected">
            <h2>{{ selected.type }}</h2>
            <label>
              <span>Title Template</span>
              <textarea [(ngModel)]="draft.titleTemplate" name="titleTemplate" rows="3"></textarea>
            </label>
            <label>
              <span>Body Template</span>
              <textarea [(ngModel)]="draft.bodyTemplate" name="bodyTemplate" rows="5"></textarea>
            </label>
            <label>
              <span>Preview Payload JSON</span>
              <textarea [(ngModel)]="previewPayloadText" name="previewPayloadText" rows="10"></textarea>
            </label>

            <div class="actions">
              <button type="button" (click)="save()">Save</button>
              <button type="button" class="secondary" (click)="preview()">Preview</button>
              <button type="button" class="secondary" (click)="reset()">Reset</button>
            </div>

            <p class="message" *ngIf="message">{{ message }}</p>

            <div class="preview-box" *ngIf="previewResult">
              <h3>Preview</h3>
              <p><strong>Title:</strong> {{ previewResult.title }}</p>
              <p><strong>Body:</strong> {{ previewResult.body }}</p>
              <details>
                <summary>Payload</summary>
                <pre>{{ previewResult.payload | json }}</pre>
              </details>
            </div>

            <details>
              <summary>Allowed Variables</summary>
              <pre>{{ selected.allowedVariables | json }}</pre>
            </details>
          </ng-container>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .page{display:grid;gap:1rem}.page-header h1{margin:.25rem 0 0}.eyebrow{margin:0;color:#6c7a89;font-weight:700;text-transform:uppercase;font-size:.78rem;letter-spacing:.08em}
      .content-grid{display:grid;grid-template-columns:minmax(18rem,24rem) 1fr;gap:1rem}
      .card{background:#fff;border:1px solid #d9e2ec;border-radius:1rem;padding:1rem;box-shadow:0 10px 24px rgba(15,23,42,.06)}
      .list-card{display:grid;gap:.75rem;align-content:start}
      .list-item{text-align:left;padding:1rem;border:1px solid #d9e2ec;border-radius:.9rem;background:#f8fafc;cursor:pointer}
      .list-item.active{border-color:#1d4ed8;background:#eef4ff}
      .detail-card{display:grid;gap:1rem}
      label{display:grid;gap:.4rem}
      label span{font-weight:700;color:#1f2937}
      textarea{width:100%;padding:.85rem;border:1px solid #cbd5e1;border-radius:.85rem;font:inherit}
      .actions{display:flex;gap:.75rem;flex-wrap:wrap}
      button{padding:.8rem 1rem;border:0;border-radius:.75rem;background:#1d4ed8;color:#fff;font-weight:700;cursor:pointer}
      .secondary{background:#475569}
      .message{margin:0;color:#166534}
      .preview-box,details{padding:1rem;border:1px solid #d9e2ec;border-radius:.9rem;background:#f8fafc}
      pre{white-space:pre-wrap;word-break:break-word;background:#0f172a;color:#e2e8f0;padding:1rem;border-radius:.85rem;overflow:auto}
      .state{color:#64748b}
      @media (max-width:960px){.content-grid{grid-template-columns:1fr}}
    `,
  ],
})
export class NotificationTemplatesComponent implements OnInit {
  items: any[] = [];
  selected: any = null;
  draft = {
    titleTemplate: '',
    bodyTemplate: '',
  };
  previewPayloadText = '{}';
  previewResult: any = null;
  message = '';

  constructor(private adminPanel: AdminPanelService) {}

  ngOnInit() {
    this.loadTemplates();
  }

  loadTemplates() {
    this.adminPanel.getNotificationTemplates().subscribe((res) => {
      this.items = res.items;
      if (!this.selected && this.items.length > 0) {
        this.selectTemplate(this.items[0].type);
      }
    });
  }

  selectTemplate(type: string) {
    this.message = '';
    this.previewResult = null;
    this.adminPanel.getNotificationTemplate(type).subscribe((res) => {
      this.selected = res.item;
      this.draft = {
        titleTemplate: res.item.titleTemplate,
        bodyTemplate: res.item.bodyTemplate,
      };
      this.previewPayloadText = JSON.stringify(res.item.samplePayload || {}, null, 2);
    });
  }

  private parsePayload() {
    return JSON.parse(this.previewPayloadText || '{}');
  }

  save() {
    if (!this.selected) return;
    this.adminPanel.updateNotificationTemplate(this.selected.type, this.draft).subscribe({
      next: (res) => {
        this.message = res.message;
        this.selected = res.item;
        this.loadTemplates();
      },
      error: (err) => {
        this.message = err.error?.message || 'Failed to save template.';
      },
    });
  }

  preview() {
    if (!this.selected) return;
    let payload: any;
    try {
      payload = this.parsePayload();
    } catch {
      this.message = 'Preview payload must be valid JSON.';
      return;
    }

    this.adminPanel.previewNotificationTemplate(this.selected.type, payload).subscribe({
      next: (res) => {
        this.message = '';
        this.previewResult = res.preview;
      },
      error: (err) => {
        this.message = err.error?.message || 'Failed to preview template.';
      },
    });
  }

  reset() {
    if (!this.selected) return;
    this.adminPanel.resetNotificationTemplate(this.selected.type).subscribe({
      next: (res) => {
        this.message = res.message;
        this.selectTemplate(res.item.type);
        this.loadTemplates();
      },
      error: (err) => {
        this.message = err.error?.message || 'Failed to reset template.';
      },
    });
  }
}
