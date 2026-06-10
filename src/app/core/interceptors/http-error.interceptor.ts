import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ModalService } from '../services/modal.service';
import { Router } from '@angular/router';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const modalService = inject(ModalService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isLoginRequest = req.url.includes('/api/auth/login');

      if (error.status === 401 && !isLoginRequest) {
        router.navigate(['/login']);
        modalService.showError(
          'Sesión caducada',
          'La sesión ha expirado. Por favor, introduce la clave de acceso de nuevo.'
        );
      } else if (error.status === 401 && isLoginRequest) {
        // Permitir que LoginComponent gestione su propia validación de credenciales
      } else {
        // Errores HTTP genéricos (500, 400, 404, de red, etc.)
        let mensaje = 'No se ha podido conectar con el servidor. Inténtalo de nuevo más tarde.';
        if (error.error && typeof error.error === 'object' && error.error.message) {
          mensaje = error.error.message;
        } else if (error.message && error.status !== 0) {
          mensaje = error.message;
        }
        
        modalService.showError(
          `Error (${error.status || 'Conexión'})`,
          mensaje
        );
      }

      return throwError(() => error);
    })
  );
};
