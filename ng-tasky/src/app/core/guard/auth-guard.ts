import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { take, switchMap, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth-service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.token$.pipe(
    take(1),
    switchMap((token) => {
      if (!token || !authService.isLoggedIn()) {
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return of(false);
      }
      return of(true);
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};