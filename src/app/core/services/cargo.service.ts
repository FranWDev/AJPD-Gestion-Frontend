import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CacheService } from './cache.service';
import {
  CargoRef,
  PageResponse,
  CargoHistorialDto,
  CargoHistorialEditDto,
  CargoHistorialFiltros,
} from '../models/miembro.model';

@Injectable({ providedIn: 'root' })
export class CargoService {
  private readonly http = inject(HttpClient);
  private readonly cacheService = inject(CacheService);
  private readonly base = `${environment.apiUrl}/api/cargos`;

  getCargos(nombre?: string, pagina: number = 0, tamano: number = 200, sort: string = 'nombre,asc'): Observable<PageResponse<CargoRef>> {
    const key = `cargos:list:${nombre || ''}_${pagina}_${tamano}_${sort}`;
    let params = new HttpParams()
      .set('page', pagina.toString())
      .set('size', tamano.toString())
      .set('sort', sort);
    if (nombre) params = params.set('nombre', nombre);
    return this.cacheService.get(key, this.http.get<PageResponse<CargoRef>>(this.base, { params }));
  }

  getCargoById(id: number): Observable<CargoRef> {
    const key = `cargos:detail:${id}`;
    return this.cacheService.get(key, this.http.get<CargoRef>(`${this.base}/${id}`));
  }

  createCargo(nombre: string): Observable<CargoRef> {
    return this.http.post<CargoRef>(this.base, { nombre }).pipe(
      tap(() => this.cacheService.clearPrefix('cargos:'))
    );
  }

  updateCargo(id: number, nombre: string): Observable<CargoRef> {
    return this.http.put<CargoRef>(`${this.base}/${id}`, { id, nombre }).pipe(
      tap(() => this.cacheService.clearPrefix('cargos:'))
    );
  }

  deleteCargo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      tap(() => this.cacheService.clearPrefix('cargos:'))
    );
  }

  getCargoHistorial(
    filtros: CargoHistorialFiltros,
    pagina: number,
    tamano: number
  ): Observable<PageResponse<CargoHistorialDto>> {
    const key = `cargos:historial:${JSON.stringify(filtros)}_${pagina}_${tamano}`;
    let params = new HttpParams()
      .set('page', pagina)
      .set('size', tamano)
      .set('sort', 'fechaInicio,desc');

    if (filtros.cargoId != null) params = params.set('cargoId', filtros.cargoId);
    if (filtros.fechaInicioDesde) params = params.set('fechaInicioDesde', filtros.fechaInicioDesde);
    if (filtros.fechaInicioHasta) params = params.set('fechaInicioHasta', filtros.fechaInicioHasta);
    if (filtros.fechaFinDesde) params = params.set('fechaFinDesde', filtros.fechaFinDesde);
    if (filtros.fechaFinHasta) params = params.set('fechaFinHasta', filtros.fechaFinHasta);
    if (filtros.buscar) params = params.set('buscar', filtros.buscar);

    return this.cacheService.get(key, this.http.get<PageResponse<CargoHistorialDto>>(`${this.base}/historial`, { params }));
  }

  updateCargoHistorial(id: number, dto: CargoHistorialEditDto): Observable<CargoHistorialDto> {
    return this.http.put<CargoHistorialDto>(`${this.base}/historial/${id}`, dto).pipe(
      tap(() => this.cacheService.clearPrefix('cargos:'))
    );
  }
}
