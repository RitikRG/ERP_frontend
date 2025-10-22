// api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/api/'; // Base URL for your backend

  constructor(private http: HttpClient) { }

  private getProductResponse(): Observable<{ message: string, products: any[] }> {
    return this.http.get<{ message: string, products: any[] }>(`${this.apiUrl}products`);
  }

  getData(): Observable<any[]> { // <-- Changed return type to array
    // 2. Pipe the response and use map to return ONLY the 'products' array
    return this.getProductResponse().pipe(
      map(response => response.products)
    );
  }

  postData(payload: any): Observable<any> {
    // Make a POST request to http://localhost:3000/api/submit
    return this.http.post(`${this.apiUrl}submit`, payload);
  }
}