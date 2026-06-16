import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CacheService } from './cache.service';
import { UserPermissions } from './auth.service';
import { PageResponse } from '../models/miembro.model';

@Injectable({ providedIn: 'root' })
export class PermisosService {
  private readonly http = inject(HttpClient);
  private readonly cacheService = inject(CacheService);
  private readonly base = `${environment.apiUrl}/api/permissions`;

  getPermissions(email?: string, pagina: number = 0, tamano: number = 10, sort: string = 'id,desc'): Observable<PageResponse<UserPermissions>> {
    const key = `permissions:list:${email || ''}_${pagina}_${tamano}_${sort}`;
    let params = new HttpParams()
      .set('page', pagina.toString())
      .set('size', tamano.toString())
      .set('sort', sort);
    if (email) params = params.set('email', email);
    return this.cacheService.get(key, this.http.get<PageResponse<UserPermissions>>(this.base, { params }));
  }

  createPermission(dto: UserPermissions): Observable<UserPermissions> {
    return this.http.post<UserPermissions>(this.base, dto).pipe(
      tap(() => this.cacheService.clearPrefix('permissions:'))
    );
  }

  updatePermission(id: number, dto: UserPermissions): Observable<UserPermissions> {
    return this.http.put<UserPermissions>(`${this.base}/${id}`, dto).pipe(
      tap(() => this.cacheService.clearPrefix('permissions:'))
    );
  }

  deletePermission(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      tap(() => this.cacheService.clearPrefix('permissions:'))
    );
  }
}
