import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviornment/enviornment';

@Injectable({
  providedIn: 'root',
})
export class SaleService {
  private apiUrl = `${environment.apiUrl}/sale`;

  constructor(private http: HttpClient) {}

    addSale(data: any) {
        return this.http.post(`${this.apiUrl}/sale`, data);
    }


    editSale(id: string, data: any) {
        return this.http.put(`${this.apiUrl}/sale/${id}`, data);
    }


    addSalePayment(org_id: string, saleId: string, data: any) {
        return this.http.post(`${this.apiUrl}/org/${org_id}/sale/${saleId}/payment`, data);
    }


    deleteSale(id: string) {
        return this.http.delete(`${this.apiUrl}/sale/${id}`);
    }

    // Get all Sales
    getAllSales(org_id: string) {
        return this.http.get(`${this.apiUrl}/${org_id}`);
    }

    // Get all products 
    getAllProducts(org_id?: string): Observable<any> {
        const url = org_id ? `${environment.apiUrl}/products?org_id=${org_id}` : `${environment.apiUrl}/products`;
        return this.http.get(url);
    }

    getAllCustomers(org_id: string) {
        return this.http.get(`${environment.apiUrl}/customers/${org_id}`);
    }

}
