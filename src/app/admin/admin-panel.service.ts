import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../enviornment/enviornment';

@Injectable({ providedIn: 'root' })
export class AdminPanelService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getOrganisations(q = '', limit = 100) {
    let params = new HttpParams().set('limit', limit);
    if (q) params = params.set('q', q);
    return this.http.get<{ organisations: any[] }>(`${this.apiUrl}/organisations`, { params });
  }

  getErrorLogs(filters: Record<string, string>) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params = params.set(key, value);
    });
    return this.http.get<{ items: any[]; page: number; limit: number; total: number }>(
      `${this.apiUrl}/error-logs`,
      { params }
    );
  }

  getErrorLog(id: string) {
    return this.http.get<{ item: any }>(`${this.apiUrl}/error-logs/${id}`);
  }

  getAiTraces(filters: Record<string, string>) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params = params.set(key, value);
    });
    return this.http.get<{ items: any[]; page: number; limit: number; total: number }>(
      `${this.apiUrl}/ai-traces`,
      { params }
    );
  }

  getAiTrace(id: string) {
    return this.http.get<{ trace: any; turns: any[] }>(`${this.apiUrl}/ai-traces/${id}`);
  }

  getNotificationTemplates() {
    return this.http.get<{ items: any[] }>(`${this.apiUrl}/notification-templates`);
  }

  getNotificationTemplate(type: string) {
    return this.http.get<{ item: any }>(`${this.apiUrl}/notification-templates/${type}`);
  }

  updateNotificationTemplate(type: string, payload: { titleTemplate: string; bodyTemplate: string }) {
    return this.http.put<{ item: any; message: string }>(
      `${this.apiUrl}/notification-templates/${type}`,
      payload
    );
  }

  previewNotificationTemplate(type: string, payload: any) {
    return this.http.post<{ preview: any }>(
      `${this.apiUrl}/notification-templates/${type}/preview`,
      { payload }
    );
  }

  resetNotificationTemplate(type: string) {
    return this.http.post<{ item: any; message: string }>(
      `${this.apiUrl}/notification-templates/${type}/reset`,
      {}
    );
  }
}
