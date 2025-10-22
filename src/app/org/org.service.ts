import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviornment/enviornment';

export interface Organisation {
  _id: string;
  name: string;
  gst: string;
  address?: string;
  phone: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrgService {
  private apiUrl = `${environment.apiUrl}/org`;

  constructor(private http: HttpClient) {}

  // Register a new organisation
  registerOrganisation(payload: {
    name: string;
    gst: string;
    address?: string;
    phone: string;
    contact_person_name?: string;
    email: string;
    password: string;
  }): Observable<{ organisation: Organisation; user: any; accessToken: string }> {
    return this.http.post<{ organisation: Organisation; user: any; accessToken: string }>(
      `${this.apiUrl}/register`,
      payload,
      { withCredentials: true } 
    );
  }
}
