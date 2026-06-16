import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CookieService } from './cookie.service';
import { CacheService } from './cache.service';

export interface UserPermissions {
  id?: number;
  email: string;
  canManagePermissions: boolean;
  canManageOrganization: boolean;
  canManageWeb: boolean;
  canManageFinances: boolean;
}

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
  readonly currentUserPermissions = signal<UserPermissions | null>(null);

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
          this.loadUserPermissions().subscribe();
        }
      })
    );
  }

  saveToken(token: string): void {
    this.cookieService.set(this.tokenKey, token, 1);
    this.token.set(token);
  }

  loadUserPermissions(): Observable<UserPermissions> {
    return this.http.get<UserPermissions>(`${environment.apiUrl}/api/auth/me`).pipe(
      tap(permissions => {
        this.currentUserPermissions.set(permissions);
      })
    );
  }

  logout(): void {
    this.cookieService.delete(this.tokenKey);
    this.token.set(null);
    this.currentUserPermissions.set(null);

    // Clear all centralized cached data
    this.cacheService.clearAll();
  }

  isAuthenticated(): boolean {
    return this.token() !== null;
  }
}
