import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../enviornment/enviornment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private baseUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

    getDashboard(org_id: string): Observable<any> {
        return this.http.get(`${this.baseUrl}/summary?org_id=${org_id}`);
    }

  getSummary(org_id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/summary?org_id=${org_id}`);
  }

  getProjections(org_id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/projections?org_id=${org_id}`);
  }
}
