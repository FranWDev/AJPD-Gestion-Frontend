export interface CargoRef {
  id: number;
  nombre: string;
}

export interface CentroRef {
  id: number;
  nombre: string;
}

export interface HistorialCargoItem {
  id: number;
  fechaInicio: string;
  fechaFin?: string | null;
  cargo: CargoRef;
}

export interface MiembroResponse {
  id: number;
  nombreRazonSocial: string;
  centro?: CentroRef;
  telefono?: string;
  correo?: string;
  cargo?: CargoRef;
  fechaCargo?: string;
  enlaceWhatsapp?: string;
  nifCif?: string;
  nacionalidad?: string;
  domicilio?: string;
  fechaNacimiento?: string;
  fechaAlta?: string;
  observaciones?: string;
  fechaBaja?: string | null;
  pronombre?: string;
  historialCargos: HistorialCargoItem[];
}

export interface MiembroRequest {
  nombreRazonSocial: string;
  centroId?: number | null;
  telefono?: string;
  correo?: string;
  cargoId?: number | null;
  fechaCargo?: string | null;
  enlaceWhatsapp?: string;
  nifCif?: string;
  nacionalidad?: string;
  domicilio?: string;
  fechaNacimiento?: string | null;
  fechaAlta?: string | null;
  observaciones?: string;
  pronombre?: string;
}

export interface MiembroFiltros {
  buscar?: string;
  filtroBaja?: 'ACTIVO' | 'BAJA' | 'TODOS';
  centroId?: number | null;
  cargoId?: number | null;
  fechaAltaDesde?: string;
  fechaAltaHasta?: string;
  fechaBajaDesde?: string;
  fechaBajaHasta?: string;
  nacionalidad?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface SortState {
  campo: string;
  direccion: 'asc' | 'desc';
}

export interface CargoHistorialDto {
  id: number;
  fechaInicio: string;
  fechaFin?: string | null;
  cargoId: number;
  cargoNombre: string;
  miembroId: number;
  miembroNombre: string;
  miembroNif?: string;
}

export interface CargoHistorialEditDto {
  fechaInicio: string;
  fechaFin?: string | null;
  cargoId: number;
}

export interface CargoHistorialFiltros {
  cargoId?: number | null;
  fechaInicioDesde?: string;
  fechaInicioHasta?: string;
  fechaFinDesde?: string;
  fechaFinHasta?: string;
  buscar?: string;
}

export interface DriveFileDto {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
}

