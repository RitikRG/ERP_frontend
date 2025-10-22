import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../enviornment/enviornment';
import { User } from '../core/models/user.model';

interface AuthResponse {
  user: User;
  accessToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUser$ = new BehaviorSubject<User | null>(null);
  private tokenKey = 'access_token';

  constructor(private http: HttpClient) {
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      // optional: decode token and preload user
    }
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUser$ = new BehaviorSubject(JSON.parse(storedUser));
    }
  }

  get user() {
    return this.currentUser$.asObservable();
  }

  get currentUserValue() {
    return this.currentUser$.value;
  }

  getAccessToken() {
    return localStorage.getItem(this.tokenKey);
  }

  private setAccessToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  private clearAccessToken() {
    localStorage.removeItem(this.tokenKey);
  }

  register(payload: { email: string; password: string; name?: string; phone?: string }) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload, { withCredentials: true }).pipe(
      tap(res => {
        this.setAccessToken(res.accessToken);
        this.currentUser$.next(res.user);
      })
    );
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }, { withCredentials: true }).pipe(
      tap(res => {
        this.setAccessToken(res.accessToken);
        this.currentUser$.next(res.user);
        localStorage.setItem('currentUser', JSON.stringify(res.user));
      })
    );
  }

  refreshToken() {
    return this.http.post<{ accessToken: string }>(`${this.apiUrl}/refresh`, {}, { withCredentials: true }).pipe(
      tap(res => this.setAccessToken(res.accessToken))
    );
  }

  logout() {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this.clearAccessToken();
        this.currentUser$.next(null);
      })
    );
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }
}
