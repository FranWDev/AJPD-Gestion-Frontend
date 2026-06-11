import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
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
  private readonly base = `${environment.apiUrl}/api/cargos`;

  getCargos(nombre?: string, pagina: number = 0, tamano: number = 200, sort: string = 'nombre,asc'): Observable<PageResponse<CargoRef>> {
    let params = new HttpParams()
      .set('page', pagina.toString())
      .set('size', tamano.toString())
      .set('sort', sort);
    if (nombre) params = params.set('nombre', nombre);
    return this.http.get<PageResponse<CargoRef>>(this.base, { params });
  }

  getCargoById(id: number): Observable<CargoRef> {
    return this.http.get<CargoRef>(`${this.base}/${id}`);
  }

  createCargo(nombre: string): Observable<CargoRef> {
    return this.http.post<CargoRef>(this.base, { nombre });
  }

  updateCargo(id: number, nombre: string): Observable<CargoRef> {
    return this.http.put<CargoRef>(`${this.base}/${id}`, { id, nombre });
  }

  deleteCargo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getCargoHistorial(
    filtros: CargoHistorialFiltros,
    pagina: number,
    tamano: number
  ): Observable<PageResponse<CargoHistorialDto>> {
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

    return this.http.get<PageResponse<CargoHistorialDto>>(`${this.base}/historial`, { params });
  }

  updateCargoHistorial(id: number, dto: CargoHistorialEditDto): Observable<CargoHistorialDto> {
    return this.http.put<CargoHistorialDto>(`${this.base}/historial/${id}`, dto);
  }
}
