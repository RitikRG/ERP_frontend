import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../enviornment/enviornment';

@Injectable({
  providedIn: 'root',
})
export class OnlineOrderService {
  private apiUrl = `${environment.apiUrl}/online-orders`;

  constructor(private http: HttpClient) {}

  getAllOnlineOrders(orgId: string) {
    return this.http.get(`${this.apiUrl}/${orgId}`);
  }

  updateOnlineOrderStatus(orgId: string, orderId: string, payload: any) {
    return this.http.put(`${this.apiUrl}/${orgId}/${orderId}/status`, payload);
  }

  assignDeliveryAgent(orderId: string, agentId: string) {
    return this.http.put(`${this.apiUrl}/${orderId}/assign-agent`, { agentId });
  }

  getOrderTracking(orderId: string) {
    return this.http.get(`${this.apiUrl}/tracking/${orderId}`);
  }
}
