import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const allowedRoles = route.data?.['roles'] as string[] | undefined;

  if (!allowedRoles?.length || allowedRoles.includes(auth.currentUserValue?.type || '')) {
    return true;
  }

  router.navigate([auth.getDefaultRoute()]);
  return false;
};
