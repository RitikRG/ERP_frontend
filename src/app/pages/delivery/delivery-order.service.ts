import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../enviornment/enviornment';

@Injectable({
  providedIn: 'root',
})
export class DeliveryOrderService {
  private apiUrl = `${environment.apiUrl}/delivery/orders`;

  constructor(private http: HttpClient) {}

  getMyOrders(scope: 'active' | 'history') {
    return this.http.get(`${this.apiUrl}/me?scope=${scope}`);
  }

  sendOtp(orderId: string) {
    return this.http.post(`${this.apiUrl}/${orderId}/send-otp`, {});
  }

  updateLocation(orderId: string, payload: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
  }) {
    return this.http.post(`${this.apiUrl}/${orderId}/location`, payload);
  }

  createCodRazorpayOrder(orderId: string) {
    return this.http.post(`${this.apiUrl}/${orderId}/cod/razorpay-order`, {});
  }

  completeOrder(orderId: string, payload: any) {
    return this.http.post(`${this.apiUrl}/${orderId}/complete`, payload);
  }
}
