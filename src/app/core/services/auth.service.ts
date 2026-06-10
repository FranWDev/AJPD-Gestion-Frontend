import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CookieService } from './cookie.service';

interface LoginRequest {
  accessKey: string;
}

interface JwtResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly cookieService = inject(CookieService);
  private readonly tokenKey = 'ajpd_jwt_token';

  // Reactividad con Signals para soporte de Zoneless
  readonly token = signal<string | null>(null);

  constructor() {
    // Restaurar el token desde las cookies al inicializar
    const savedToken = this.cookieService.get(this.tokenKey);
    if (savedToken) {
      this.token.set(savedToken);
    }
  }

  login(accessKey: string): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${environment.apiUrl}/api/auth/login`, { accessKey }).pipe(
      tap(response => {
        if (response && response.token) {
          this.cookieService.set(this.tokenKey, response.token, 1); // Expira en 1 día
          this.token.set(response.token);
        }
      })
    );
  }

  logout(): void {
    this.cookieService.delete(this.tokenKey);
    this.token.set(null);
  }

  isAuthenticated(): boolean {
    return this.token() !== null;
  }
}
