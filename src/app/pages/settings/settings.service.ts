import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviornment/enviornment';

@Injectable({ providedIn: 'root' })
export class SettingsService {

  constructor(private http: HttpClient) {}

  // ---- USER SETTINGS ----
  getUserSettings(org_id: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/settings/user/${org_id}`);
  }

  updateUserSettings(userId: string, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/settings/user/${userId}`, data);
  }

  // ---- ORG SETTINGS ----
  getOrgSettings(org_id: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/settings/org/${org_id}`);
  }

  updateOrgSettings(org_id: string, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/settings/org/${org_id}`, data);
  }

  // ---- SOP SETTINGS ----
  getSopSettings(org_id: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/settings/sop/${org_id}`);
  }

  updateSopSettings(org_id: string, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/settings/sop/${org_id}`, data);
  }
}
