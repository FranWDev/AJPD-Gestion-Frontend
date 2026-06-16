import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService, UserPermissions } from '../services/auth.service';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const permissions = authService.currentUserPermissions();
  if (permissions) {
    return checkPermissions(permissions, state.url, router, authService);
  }

  return authService.loadUserPermissions().pipe(
    map(perms => checkPermissions(perms, state.url, router, authService)),
    catchError(() => {
      router.navigate(['/login']);
      authService.logout();
      return of(false);
    })
  );
};

function checkPermissions(permissions: UserPermissions, url: string, router: Router, authService: AuthService): boolean {
  if (url === '/' || url === '') {
    if (permissions.canManageOrganization) {
      router.navigate(['/organizacion/miembros']);
      return false;
    } else if (permissions.canManageWeb) {
      router.navigate(['/web/noticias']);
      return false;
    } else if (permissions.canManagePermissions) {
      router.navigate(['/seguridad/permisos']);
      return false;
    } else {
      router.navigate(['/login']);
      authService.logout();
      return false;
    }
  }

  if (url.startsWith('/organizacion')) {
    if (!permissions.canManageOrganization) {
      if (permissions.canManageWeb) {
        router.navigate(['/web/noticias']);
      } else if (permissions.canManagePermissions) {
        router.navigate(['/seguridad/permisos']);
      } else {
        router.navigate(['/login']);
        authService.logout();
      }
      return false;
    }
  } else if (url.startsWith('/web')) {
    if (!permissions.canManageWeb) {
      if (permissions.canManageOrganization) {
        router.navigate(['/organizacion/miembros']);
      } else if (permissions.canManagePermissions) {
        router.navigate(['/seguridad/permisos']);
      } else {
        router.navigate(['/login']);
        authService.logout();
      }
      return false;
    }
  } else if (url.startsWith('/seguridad')) {
    if (!permissions.canManagePermissions) {
      if (permissions.canManageOrganization) {
        router.navigate(['/organizacion/miembros']);
      } else if (permissions.canManageWeb) {
        router.navigate(['/web/noticias']);
      } else {
        router.navigate(['/login']);
        authService.logout();
      }
      return false;
    }
  }
  return true;
}
