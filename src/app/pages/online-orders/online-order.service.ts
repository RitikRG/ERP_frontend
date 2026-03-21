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
}
