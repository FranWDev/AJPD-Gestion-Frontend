import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CookieService } from './cookie.service';
import { CacheService } from './cache.service';

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
  private readonly cacheService = inject(CacheService);
  private readonly tokenKey = 'ajpd_jwt_token';

  readonly token = signal<string | null>(null);

  constructor() {
    const savedToken = this.cookieService.get(this.tokenKey);
    if (savedToken) {
      this.token.set(savedToken);
    }
  }

  login(accessKey: string): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${environment.apiUrl}/api/auth/login`, { accessKey }).pipe(
      tap(response => {
        if (response && response.token) {
          this.saveToken(response.token);
        }
      })
    );
  }

  saveToken(token: string): void {
    this.cookieService.set(this.tokenKey, token, 1);
    this.token.set(token);
  }

  logout(): void {
    this.cookieService.delete(this.tokenKey);
    this.token.set(null);

    // Clear all centralized cached data
    this.cacheService.clearAll();
  }

  isAuthenticated(): boolean {
    return this.token() !== null;
  }
}
