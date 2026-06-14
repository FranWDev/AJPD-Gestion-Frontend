import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CacheService } from './cache.service';
import { CentroRef, PageResponse } from '../models/miembro.model';

@Injectable({ providedIn: 'root' })
export class CentroService {
  private readonly http = inject(HttpClient);
  private readonly cacheService = inject(CacheService);
  private readonly base = `${environment.apiUrl}/api/centros`;

  getCentros(nombre?: string, pagina: number = 0, tamano: number = 200, sort: string = 'nombre,asc'): Observable<PageResponse<CentroRef>> {
    const key = `centros:list:${nombre || ''}_${pagina}_${tamano}_${sort}`;
    let params = new HttpParams()
      .set('page', pagina.toString())
      .set('size', tamano.toString())
      .set('sort', sort);
    if (nombre) params = params.set('nombre', nombre);
    return this.cacheService.get(key, this.http.get<PageResponse<CentroRef>>(this.base, { params }));
  }

  getCentroById(id: number): Observable<CentroRef> {
    const key = `centros:detail:${id}`;
    return this.cacheService.get(key, this.http.get<CentroRef>(`${this.base}/${id}`));
  }

  createCentro(nombre: string): Observable<CentroRef> {
    return this.http.post<CentroRef>(this.base, { nombre }).pipe(
      tap(() => this.cacheService.clearPrefix('centros:'))
    );
  }

  updateCentro(id: number, nombre: string): Observable<CentroRef> {
    return this.http.put<CentroRef>(`${this.base}/${id}`, { id, nombre }).pipe(
      tap(() => this.cacheService.clearPrefix('centros:'))
    );
  }

  deleteCentro(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      tap(() => this.cacheService.clearPrefix('centros:'))
    );
  }
}
