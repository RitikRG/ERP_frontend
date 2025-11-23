import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviornment/enviornment';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private apiUrl = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) {}

    getCustomerList(org_id: string) {
        return this.http.get(`${this.apiUrl}/${org_id}/list`);
    }

    updateCustomer(org_id: string, id: string, data: any) {
        return this.http.put(`${this.apiUrl}/${org_id}/${id}`, data);
    }

    getCustomerDetails(org_id: string, customer_id: string) {
        return this.http.get(`${this.apiUrl}/${org_id}/${customer_id}/details`);
    }

    addCustomer(org_id: string, data: any) {
        return this.http.post(`${this.apiUrl}/create?org_id=${org_id}`, data);
    }


}
