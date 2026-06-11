import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MiembroResponse,
  MiembroRequest,
  MiembroFiltros,
  PageResponse,
} from '../models/miembro.model';

@Injectable({ providedIn: 'root' })
export class MiembroService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/miembros`;

  getMiembros(
    filtros: MiembroFiltros,
    pagina: number,
    tamano: number,
    sort: string
  ): Observable<PageResponse<MiembroResponse>> {
    let params = new HttpParams()
      .set('page', pagina)
      .set('size', tamano)
      .set('sort', sort);

    if (filtros.buscar) params = params.set('buscar', filtros.buscar);
    if (filtros.filtroBaja) {
      const val = filtros.filtroBaja === 'ACTIVO' ? 'ACTIVOS' : filtros.filtroBaja === 'BAJA' ? 'BAJAS' : filtros.filtroBaja;
      params = params.set('filtroBaja', val);
    }
    if (filtros.centroId != null) params = params.set('centroId', filtros.centroId);
    if (filtros.cargoId != null) params = params.set('cargoId', filtros.cargoId);
    if (filtros.fechaAltaDesde) params = params.set('fechaAltaDesde', filtros.fechaAltaDesde);
    if (filtros.fechaAltaHasta) params = params.set('fechaAltaHasta', filtros.fechaAltaHasta);
    if (filtros.fechaBajaDesde) params = params.set('fechaBajaDesde', filtros.fechaBajaDesde);
    if (filtros.fechaBajaHasta) params = params.set('fechaBajaHasta', filtros.fechaBajaHasta);
    if (filtros.nacionalidad) params = params.set('nacionalidad', filtros.nacionalidad);

    return this.http.get<PageResponse<MiembroResponse>>(this.base, { params });
  }

  getMiembroById(id: number): Observable<MiembroResponse> {
    return this.http.get<MiembroResponse>(`${this.base}/${id}`);
  }

  createMiembro(dto: MiembroRequest): Observable<MiembroResponse> {
    return this.http.post<MiembroResponse>(this.base, dto);
  }

  updateMiembro(id: number, dto: MiembroRequest): Observable<MiembroResponse> {
    return this.http.put<MiembroResponse>(`${this.base}/${id}`, dto);
  }

  darDeBaja(id: number, fechaBaja?: string): Observable<MiembroResponse> {
    const body = fechaBaja ? { fechaBaja } : {};
    return this.http.put<MiembroResponse>(`${this.base}/${id}/baja`, body);
  }

  reactivar(id: number): Observable<MiembroResponse> {
    return this.http.delete<MiembroResponse>(`${this.base}/${id}/baja`);
  }

  deleteMiembro(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  updateHistorialCargo(
    miembroId: number,
    historialId: number,
    body: { fechaInicio: string; fechaFin?: string | null; cargo: { id: number } }
  ): Observable<MiembroResponse> {
    return this.http.put<MiembroResponse>(`${this.base}/${miembroId}/historial/${historialId}`, body);
  }

  deleteHistorialCargo(miembroId: number, historialId: number): Observable<MiembroResponse> {
    return this.http.delete<MiembroResponse>(`${this.base}/${miembroId}/historial/${historialId}`);
  }
}
