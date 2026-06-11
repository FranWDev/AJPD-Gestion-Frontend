import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { MiembroService } from '../../core/services/miembro.service';
import { CentroService } from '../../core/services/centro.service';
import { CargoService } from '../../core/services/cargo.service';
import { ModalMiembroService } from '../../shared/components/modal-miembro/modal-miembro.service';
import { ModalConfirmService } from '../../shared/components/modal-confirm/modal-confirm.service';
import { ModalDetailService } from '../../shared/components/modal-detail/modal-detail.service';
import { ModalDocumentosService } from '../../shared/components/modal-documentos/modal-documentos.service';

import {
  MiembroResponse,
  MiembroFiltros,
  PageResponse,
  CentroRef,
  CargoRef,
  SortState,
} from '../../core/models/miembro.model';

@Component({
  selector: 'app-miembros',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './miembros.html',
  styleUrl: './miembros.css',
})
export class MiembrosComponent implements OnInit, OnDestroy {
  private readonly miembroService = inject(MiembroService);
  private readonly centroService = inject(CentroService);
  private readonly cargoService = inject(CargoService);
  private readonly modalMiembro = inject(ModalMiembroService);
  private readonly modalConfirm = inject(ModalConfirmService);
  private readonly modalDetail = inject(ModalDetailService);
  private readonly modalDocumentos = inject(ModalDocumentosService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly buscarSubject = new Subject<string>();

  // Estado de la pagina
  readonly datos = signal<PageResponse<MiembroResponse> | null>(null);
  readonly cargando = signal(false);
  readonly centros = signal<CentroRef[]>([]);
  readonly cargos = signal<CargoRef[]>([]);

  // Filtros
  readonly filtros = signal<MiembroFiltros>({ filtroBaja: 'TODOS' });
  readonly pagina = signal(0);
  readonly tamano = signal(10);
  readonly sort = signal<SortState>({ campo: 'nombreRazonSocial', direccion: 'asc' });
  readonly mostrarFiltrosAvanzados = signal(false);

  readonly nacionalidades = [
    'Española',
    'Estadounidense',
    'Británica',
    'Argentina',
    'Colombiana',
    'Mexicana',
    'Chilena',
    'Peruana',
    'Venezolana',
    'Francesa',
    'Italiana',
    'Alemana',
    'Portuguesa',
    'Otra'
  ];

  // UI helpers
  readonly tieneFiltrosActivos = computed(() => {
    const f = this.filtros();
    return !!(
      f.buscar?.trim() ||
      f.filtroBaja !== 'TODOS' ||
      f.centroId != null ||
      f.cargoId != null ||
      f.fechaAltaDesde ||
      f.fechaAltaHasta ||
      f.fechaBajaDesde ||
      f.fechaBajaHasta ||
      f.nacionalidad
    );
  });

  readonly mostrarFiltrosFecha = computed(
    () => this.filtros().filtroBaja === 'BAJA' || this.filtros().filtroBaja === 'TODOS'
  );
  readonly totalPaginas = computed(() => this.datos()?.totalPages ?? 0);
  readonly totalElementos = computed(() => this.datos()?.totalElements ?? 0);
  readonly paginas = computed(() => {
    const total = this.totalPaginas();
    const actual = this.pagina();
    const pages: (number | '...')[] = [];
    for (let i = 0; i < total; i++) {
      if (i === 0 || i === total - 1 || Math.abs(i - actual) <= 1) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  });

  readonly sortString = computed(
    () => `${this.sort().campo},${this.sort().direccion}`
  );

  ngOnInit(): void {
    this.cargarOpciones();
    this.cargar();

    this.buscarSubject.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(valor => {
      this.filtros.update(f => ({ ...f, buscar: valor || undefined }));
      this.pagina.set(0);
      this.cargar();
    });

    this.modalMiembro.guardado$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.cargar();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarOpciones(): void {
    this.centroService.getCentros().subscribe({
      next: (p) => this.centros.set(p.content),
      error: () => {},
    });
    this.cargoService.getCargos().subscribe({
      next: (p) => this.cargos.set(p.content),
      error: () => {},
    });
  }

  cargar(): void {
    this.cargando.set(true);
    this.miembroService
      .getMiembros(this.filtros(), this.pagina(), this.tamano(), this.sortString())
      .subscribe({
        next: (page) => {
          this.datos.set(page);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
        },
      });
  }

  // ---- Filtros ----
  onBuscarChange(valor: string): void {
    this.buscarSubject.next(valor);
  }

  aplicarFiltro<K extends keyof MiembroFiltros>(key: K, valor: MiembroFiltros[K]): void {
    this.filtros.update(f => ({ ...f, [key]: valor || undefined }));
    this.pagina.set(0);
    this.cargar();
  }

  limpiarFiltros(): void {
    this.filtros.set({ filtroBaja: 'TODOS' });
    this.pagina.set(0);
    this.cargar();
  }

  // ---- Ordenacion ----
  ordenarPor(campo: string): void {
    this.sort.update(s =>
      s.campo === campo
        ? { campo, direccion: s.direccion === 'asc' ? 'desc' : 'asc' }
        : { campo, direccion: 'asc' }
    );
    this.pagina.set(0);
    this.cargar();
  }

  // ---- Paginacion ----
  irAPagina(p: number | '...'): void {
    if (typeof p !== 'number') return;
    this.pagina.set(p);
    this.cargar();
  }

  cambiarTamano(tamano: number): void {
    this.tamano.set(tamano);
    this.pagina.set(0);
    this.cargar();
  }

  // ---- Acciones ----
  abrirNuevo(): void {
    this.modalMiembro.open();
  }

  editar(miembro: MiembroResponse): void {
    this.modalMiembro.open(miembro);
  }

  onGuardado(): void {
    this.cargar();
  }

  verDetalle(miembro: MiembroResponse): void {
    this.modalDetail.open(miembro);
  }

  verDocumentos(miembro: MiembroResponse): void {
    this.modalDocumentos.open(miembro.id, miembro.nombreRazonSocial);
  }

  verHistorial(miembro: MiembroResponse): void {
    this.router.navigate(['/historial'], { queryParams: { miembroId: miembro.id } });
  }

  darDeBaja(miembro: MiembroResponse): void {
    this.modalConfirm.open({
      titulo: 'Dar de baja al miembro',
      mensaje: `¿Deseas dar de baja a "${miembro.nombreRazonSocial}"? Esta accion puede revertirse.`,
      tipo: 'warning',
      labelConfirmar: 'Dar de baja',
      onConfirmar: () => {
        this.miembroService.darDeBaja(miembro.id).subscribe({
          next: () => this.cargar(),
          error: () => {},
        });
      },
    });
  }

  revertirBaja(miembro: MiembroResponse): void {
    this.modalConfirm.open({
      titulo: 'Revertir baja',
      mensaje: `¿Deseas reactivar a "${miembro.nombreRazonSocial}" como miembro activo?`,
      tipo: 'info',
      labelConfirmar: 'Reactivar',
      onConfirmar: () => {
        this.miembroService.reactivar(miembro.id).subscribe({
          next: () => this.cargar(),
          error: () => {},
        });
      },
    });
  }

  eliminar(miembro: MiembroResponse): void {
    this.modalConfirm.open({
      titulo: 'Eliminar miembro',
      mensaje: `Esta accion es permanente e irreversible. ¿Confirmas eliminar a "${miembro.nombreRazonSocial}"?`,
      tipo: 'danger',
      labelConfirmar: 'Eliminar definitivamente',
      onConfirmar: () => {
        this.miembroService.deleteMiembro(miembro.id).subscribe({
          next: () => this.cargar(),
          error: () => {},
        });
      },
    });
  }

  // ---- Helpers de vista ----
  esBaja(m: MiembroResponse): boolean {
    return !!m.fechaBaja;
  }

  iconoSort(campo: string): 'asc' | 'desc' | null {
    const s = this.sort();
    return s.campo === campo ? s.direccion : null;
  }
}
