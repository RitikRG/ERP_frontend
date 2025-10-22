import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviornment/enviornment';
import { Product } from '../../core/models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  // create a new product
  // createProduct(payload: {
  //   org_id: string;
  //   name: string;
  //   p_code: string;
  //   img?: string;
  //   cost: Number;
  //   price: Number;
  //   tax_rate: Number;
  //   tax_type: string;
  //   cess: Number;
  // }): Observable<{ product: Product; user: any; accessToken: string }> {
  //   return this.http.post<{ product: Product; user: any; accessToken: string }>(
  //     `${this.apiUrl}`,
  //     payload,
  //     { withCredentials: true } 
  //   );
  // }
  createProduct(data: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/`, data);
  }
}
