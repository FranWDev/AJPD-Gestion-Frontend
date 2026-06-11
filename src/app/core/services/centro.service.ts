import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CentroRef, PageResponse } from '../models/miembro.model';

@Injectable({ providedIn: 'root' })
export class CentroService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/centros`;

  getCentros(nombre?: string, pagina: number = 0, tamano: number = 200, sort: string = 'nombre,asc'): Observable<PageResponse<CentroRef>> {
    let params = new HttpParams()
      .set('page', pagina.toString())
      .set('size', tamano.toString())
      .set('sort', sort);
    if (nombre) params = params.set('nombre', nombre);
    return this.http.get<PageResponse<CentroRef>>(this.base, { params });
  }

  getCentroById(id: number): Observable<CentroRef> {
    return this.http.get<CentroRef>(`${this.base}/${id}`);
  }

  createCentro(nombre: string): Observable<CentroRef> {
    return this.http.post<CentroRef>(this.base, { nombre });
  }

  updateCentro(id: number, nombre: string): Observable<CentroRef> {
    return this.http.put<CentroRef>(`${this.base}/${id}`, { id, nombre });
  }

  deleteCentro(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
