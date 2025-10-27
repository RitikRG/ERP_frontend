import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviornment/enviornment';

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private apiUrl = `${environment.apiUrl}/supplier`;

  constructor(private http: HttpClient) {}

  // create a new product
  createSupplier(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/`, data, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get all suppliers ( by organisation)
  getAllSuppliers(org_id?: string): Observable<any> {
    const url = org_id ? `${this.apiUrl}?org_id=${org_id}` : this.apiUrl;
    return this.http.get(url);
  }

  // Delete Product
  deleteProduct(org_id: string, product_id: string): Observable<any> {
    const url = `${this.apiUrl}/delete/${org_id}/${product_id}`;
    return this.http.delete(url);
  }

  // Edit product
  getProductById(org_id: string, id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/edit/${org_id}/${id}`);
  }

  // Update product
  updateProduct(org_id: string, id: string, data: FormData): Observable<any> {
    return this.http.patch(`${this.apiUrl}/edit/${org_id}/${id}`, data);
  }
}
