import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviornment/enviornment';


@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private baseUrl = `${environment.apiUrl}/purchase`;

  constructor(private http: HttpClient) {}

  createPurchase(data: any): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  getPurchases(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  // Getting suppliers 
  getAllSuppliers(org_id?: string): Observable<any> {
    const url = org_id ? `${environment.apiUrl}/supplier?org_id=${org_id}` : `${environment.apiUrl}/supplier`;
    return this.http.get(url);
  }

  // Get all products 
  getAllProducts(org_id?: string): Observable<any> {
    const url = org_id ? `${environment.apiUrl}/products?org_id=${org_id}` : `${environment.apiUrl}/products`;
    return this.http.get(url);
  }

}
