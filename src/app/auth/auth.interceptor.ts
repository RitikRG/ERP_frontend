import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { AdminAuthService } from '../admin/admin-auth.service';
import { ErrorLoggingService } from '../services/error-logging.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../enviornment/enviornment';

export const AuthInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);
  const adminAuth = inject(AdminAuthService);
  const errorLogging = inject(ErrorLoggingService);
  const isAdminRequest = req.url.startsWith(`${environment.apiUrl}/admin/`);
  const isAdminAuthRequest = req.url.startsWith(`${environment.apiUrl}/admin/auth/`);
  const isUserAuthRequest = req.url.startsWith(`${environment.apiUrl}/auth/`);
  const token = isAdminRequest ? adminAuth.getAccessToken() : auth.getAccessToken();

  const cloned = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  const reportAndThrow = (error: HttpErrorResponse, request: HttpRequest<any>) => {
    errorLogging.captureHttpError(error, request);
    return throwError(() => error);
  };

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        if (isAdminRequest && !isAdminAuthRequest) {
          return adminAuth.refreshToken().pipe(
            switchMap(() => {
              const newToken = adminAuth.getAccessToken();
              const newReq = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
              return next(newReq).pipe(
                catchError((retryError: HttpErrorResponse) => reportAndThrow(retryError, newReq))
              );
            }),
            catchError((refreshError: HttpErrorResponse) => reportAndThrow(refreshError, req))
          );
        }

        if (!isAdminRequest && !isUserAuthRequest) {
          return auth.refreshToken().pipe(
            switchMap(() => {
              const newToken = auth.getAccessToken();
              const newReq = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
              return next(newReq).pipe(
                catchError((retryError: HttpErrorResponse) => reportAndThrow(retryError, newReq))
              );
            }),
            catchError((refreshError: HttpErrorResponse) => reportAndThrow(refreshError, req))
          );
        }
      }
      return reportAndThrow(err, cloned);
    })
  );
};
