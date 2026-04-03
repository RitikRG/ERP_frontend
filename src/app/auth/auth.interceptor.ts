import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { AdminAuthService } from '../admin/admin-auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../enviornment/enviornment';

export const AuthInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);
  const adminAuth = inject(AdminAuthService);
  const isAdminRequest = req.url.startsWith(`${environment.apiUrl}/admin/`);
  const isAdminAuthRequest = req.url.startsWith(`${environment.apiUrl}/admin/auth/`);
  const isUserAuthRequest = req.url.startsWith(`${environment.apiUrl}/auth/`);
  const token = isAdminRequest ? adminAuth.getAccessToken() : auth.getAccessToken();

  const cloned = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        if (isAdminRequest && !isAdminAuthRequest) {
          return adminAuth.refreshToken().pipe(
            switchMap(() => {
              const newToken = adminAuth.getAccessToken();
              const newReq = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
              return next(newReq);
            })
          );
        }

        if (!isAdminRequest && !isUserAuthRequest) {
          return auth.refreshToken().pipe(
            switchMap(() => {
              const newToken = auth.getAccessToken();
              const newReq = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
              return next(newReq);
            })
          );
        }
      }
      return throwError(() => err);
    })
  );
};
