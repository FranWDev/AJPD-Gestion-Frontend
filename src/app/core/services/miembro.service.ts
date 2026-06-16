import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CacheService } from './cache.service';
import {
  MiembroResponse,
  MiembroRequest,
  MiembroFiltros,
  PageResponse,
  DriveFileDto,
} from '../models/miembro.model';

@Injectable({ providedIn: 'root' })
export class MiembroService {
  private readonly http = inject(HttpClient);
  private readonly cacheService = inject(CacheService);
  private readonly base = `${environment.apiUrl}/api/miembros`;

  getMiembros(
    filtros: MiembroFiltros,
    pagina: number,
    tamano: number,
    sort: string
  ): Observable<PageResponse<MiembroResponse>> {
    const key = `miembros:list:${JSON.stringify(filtros)}_${pagina}_${tamano}_${sort}`;
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

    return this.cacheService.get(key, this.http.get<PageResponse<MiembroResponse>>(this.base, { params }));
  }

  getMiembroById(id: number): Observable<MiembroResponse> {
    const key = `miembros:detail:${id}`;
    return this.cacheService.get(key, this.http.get<MiembroResponse>(`${this.base}/${id}`));
  }

  createMiembro(dto: MiembroRequest): Observable<MiembroResponse> {
    return this.http.post<MiembroResponse>(this.base, dto).pipe(
      tap(() => this.cacheService.clearPrefix('miembros:'))
    );
  }

  updateMiembro(id: number, dto: MiembroRequest): Observable<MiembroResponse> {
    return this.http.put<MiembroResponse>(`${this.base}/${id}`, dto).pipe(
      tap(() => this.cacheService.clearPrefix('miembros:'))
    );
  }

  darDeBaja(id: number, fechaBaja?: string): Observable<MiembroResponse> {
    const body = fechaBaja ? { fechaBaja } : {};
    return this.http.put<MiembroResponse>(`${this.base}/${id}/baja`, body).pipe(
      tap(() => this.cacheService.clearPrefix('miembros:'))
    );
  }

  reactivar(id: number): Observable<MiembroResponse> {
    return this.http.delete<MiembroResponse>(`${this.base}/${id}/baja`).pipe(
      tap(() => this.cacheService.clearPrefix('miembros:'))
    );
  }

  deleteMiembro(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      tap(() => this.cacheService.clearPrefix('miembros:'))
    );
  }

  updateHistorialCargo(
    miembroId: number,
    historialId: number,
    body: { fechaInicio: string; fechaFin?: string | null; cargo: { id: number } }
  ): Observable<MiembroResponse> {
    return this.http.put<MiembroResponse>(`${this.base}/${miembroId}/historial/${historialId}`, body).pipe(
      tap(() => this.cacheService.clearPrefix('miembros:'))
    );
  }

  deleteHistorialCargo(miembroId: number, historialId: number): Observable<MiembroResponse> {
    return this.http.delete<MiembroResponse>(`${this.base}/${miembroId}/historial/${historialId}`).pipe(
      tap(() => this.cacheService.clearPrefix('miembros:'))
    );
  }

  getDocumentos(miembroId: number, tipo: 'DNI' | 'FOTO'): Observable<DriveFileDto[]> {
    return this.http.get<DriveFileDto[]>(`${this.base}/${miembroId}/documentos/${tipo}`);
  }

  getUploadUrl(miembroId: number, tipo: 'DNI' | 'FOTO', fileName: string, contentType: string): Observable<{ uploadUrl: string }> {
    const params = new HttpParams()
      .set('fileName', fileName)
      .set('contentType', contentType);
    return this.http.post<{ uploadUrl: string }>(`${this.base}/${miembroId}/documentos/${tipo}/upload-url`, null, { params });
  }

  uploadFileToUrl(uploadUrl: string, file: File): Observable<any> {
    // We use native XMLHttpRequest to bypass all Angular HTTP interceptors.
    // External APIs (like Google Drive upload sessions) will reject requests containing the app's JWT token.
    return new Observable(observer => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          observer.next({
            type: HttpEventType.UploadProgress,
            loaded: event.loaded,
            total: event.total
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          observer.next({
            type: HttpEventType.Response,
            body: xhr.response
          });
          observer.complete();
        } else {
          observer.error(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', (err) => {
        observer.error(err);
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);

      return () => {
        xhr.abort();
      };
    });
  }

  deleteDocumento(miembroId: number, fileId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${miembroId}/documentos/archivo/${fileId}`);
  }

  getGoogleAccessToken(miembroId: number): Observable<{ accessToken: string }> {
    return this.http.get<{ accessToken: string }>(`${this.base}/${miembroId}/documentos/token/google`);
  }

  downloadFileFromGoogle(fileId: string, accessToken: string): Observable<Blob> {
    const headers = { Authorization: `Bearer ${accessToken}` };
    return this.http.get(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`, {
      headers,
      responseType: 'blob'
    });
  }
}
