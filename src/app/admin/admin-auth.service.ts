import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, of, tap } from 'rxjs';
import { environment } from '../../enviornment/enviornment';

export interface AdminUser {
  _id: string;
  id: string;
  email: string;
  name: string;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface AdminAuthResponse {
  admin: AdminUser;
  accessToken: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private apiUrl = `${environment.apiUrl}/admin/auth`;
  private currentAdmin$ = new BehaviorSubject<AdminUser | null>(null);
  private tokenKey = 'admin_access_token';
  private adminKey = 'currentAdminUser';
  private deviceIdKey = 'admin_deviceId';

  constructor(private http: HttpClient) {
    const storedAdmin = localStorage.getItem(this.adminKey);
    if (storedAdmin) {
      this.currentAdmin$.next(JSON.parse(storedAdmin));
    }
  }

  get admin() {
    return this.currentAdmin$.asObservable();
  }

  get currentAdminValue() {
    return this.currentAdmin$.value;
  }

  getAccessToken() {
    return localStorage.getItem(this.tokenKey);
  }

  private setAccessToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  private setCurrentAdmin(admin: AdminUser | null) {
    this.currentAdmin$.next(admin);

    if (admin) {
      localStorage.setItem(this.adminKey, JSON.stringify(admin));
    } else {
      localStorage.removeItem(this.adminKey);
    }
  }

  private clearAccessToken() {
    localStorage.removeItem(this.tokenKey);
  }

  private clearSession() {
    this.clearAccessToken();
    this.setCurrentAdmin(null);
  }

  getDeviceId(): string {
    let id = localStorage.getItem(this.deviceIdKey);
    if (!id) {
      id = `admin_${Math.random().toString(36).slice(2, 11)}${Date.now()}`;
      localStorage.setItem(this.deviceIdKey, id);
    }
    return id;
  }

  getDeviceLabel(): string {
    return navigator.userAgent || 'Unknown Device';
  }

  login(email: string, password: string) {
    return this.http
      .post<AdminAuthResponse>(
        `${this.apiUrl}/login`,
        {
          email,
          password,
          deviceId: this.getDeviceId(),
          deviceLabel: this.getDeviceLabel(),
        },
        { withCredentials: true }
      )
      .pipe(
        tap((res) => {
          this.setAccessToken(res.accessToken);
          this.setCurrentAdmin(res.admin);
        })
      );
  }

  refreshToken() {
    return this.http
      .post<{ accessToken: string }>(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
      .pipe(tap((res) => this.setAccessToken(res.accessToken)));
  }

  logout() {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => this.clearSession()),
      catchError((error) => {
        this.clearSession();
        return of(error);
      })
    );
  }

  isLoggedIn() {
    return !!this.getAccessToken() && !!this.currentAdminValue;
  }
}
