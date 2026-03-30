import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, of, tap } from 'rxjs';
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
  private userKey = 'currentUser';

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem(this.userKey);
    if (storedUser) {
      this.currentUser$.next(JSON.parse(storedUser));
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

  private setCurrentUser(user: User | null) {
    this.currentUser$.next(user);

    if (user) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.userKey);
    }
  }

  private clearAccessToken() {
    localStorage.removeItem(this.tokenKey);
  }

  private clearSession() {
    this.clearAccessToken();
    this.setCurrentUser(null);
  }

  register(payload: { email: string; password: string; name?: string; phone?: string; org_id?: string }) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload, { withCredentials: true }).pipe(
      tap(res => {
        this.setAccessToken(res.accessToken);
        this.setCurrentUser(res.user);
      })
    );
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }, { withCredentials: true }).pipe(
      tap(res => {
        this.setAccessToken(res.accessToken);
        this.setCurrentUser(res.user);
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
        this.clearSession();
      }),
      catchError((error) => {
        this.clearSession();
        return of(error);
      })
    );
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken() && !!this.currentUser$.value;
  }

  updateCurrentUserOrganisation(org: any) {
    const currentUser = this.currentUser$.value;

    if (!currentUser) {
      return;
    }

    const updatedUser = {
      ...currentUser,
      org: {
        ...(currentUser.org || {}),
        ...org,
      },
    };

    this.setCurrentUser(updatedUser);
  }

  hasRole(...roles: Array<User['type']>) {
    const currentRole = this.currentUserValue?.type;
    return !!currentRole && roles.includes(currentRole);
  }

  getDefaultRoute() {
    return this.currentUserValue?.type === 'delivery_agent'
      ? '/delivery/orders'
      : '/dashboard';
  }
}
