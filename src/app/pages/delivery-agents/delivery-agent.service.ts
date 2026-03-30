import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../enviornment/enviornment';

@Injectable({
  providedIn: 'root',
})
export class DeliveryAgentService {
  private apiUrl = `${environment.apiUrl}/delivery-agents`;

  constructor(private http: HttpClient) {}

  getAgents() {
    return this.http.get(`${this.apiUrl}`);
  }

  createAgent(payload: {
    name: string;
    email: string;
    phone?: string;
    password: string;
  }) {
    return this.http.post(`${this.apiUrl}`, payload);
  }

  updateAgent(agentId: string, payload: {
    name?: string;
    phone?: string;
    password?: string;
    isActive?: boolean;
  }) {
    return this.http.put(`${this.apiUrl}/${agentId}`, payload);
  }
}
