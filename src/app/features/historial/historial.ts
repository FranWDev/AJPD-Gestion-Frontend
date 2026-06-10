import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { CargoService } from '../../core/services/cargo.service';
import { MiembroService } from '../../core/services/miembro.service';
import { ModalConfirmService } from '../../shared/components/modal-confirm/modal-confirm.service';
import { ModalHistorialService } from '../../shared/components/modal-historial/modal-historial.service';

import {
  CargoHistorialDto,
  CargoHistorialFiltros,
  PageResponse,
  MiembroResponse,
  CargoRef,
} from '../../core/models/miembro.model';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './historial.html',
  styleUrl: './historial.css',
})
export class HistorialComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cargoService = inject(CargoService);
  private readonly miembroService = inject(MiembroService);
  private readonly modalConfirm = inject(ModalConfirmService);
  private readonly modalHistorial = inject(ModalHistorialService);
  private readonly destroy$ = new Subject<void>();
  private readonly buscarSubject = new Subject<string>();

  // ID de miembro (si filtramos por uno específico)
  readonly miembroId = signal<number | null>(null);
  readonly miembro = signal<MiembroResponse | null>(null);

  // Estado global del historial
  readonly datosGlobal = signal<PageResponse<CargoHistorialDto> | null>(null);
  readonly cargos = signal<CargoRef[]>([]);
  readonly cargando = signal(false);

  // Filtros de vista global
  readonly filtros = signal<CargoHistorialFiltros>({});
  readonly pagina = signal(0);
  readonly tamano = signal(10);

  // UI Helpers
  readonly tieneFiltrosActivos = computed(() => {
    const f = this.filtros();
    return !!(
      f.buscar?.trim() ||
      f.cargoId != null ||
      f.fechaInicioDesde ||
      f.fechaInicioHasta ||
      f.fechaFinDesde ||
      f.fechaFinHasta
    );
  });

  readonly totalPaginas = computed(() => this.datosGlobal()?.totalPages ?? 0);
  readonly totalElementos = computed(() => this.datosGlobal()?.totalElements ?? 0);
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

  ngOnInit(): void {
    // Escuchar parámetros de query (?miembroId=X)
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params['miembroId'];
      if (id) {
        this.miembroId.set(+id);
        this.cargarMiembro(+id);
      } else {
        this.miembroId.set(null);
        this.miembro.set(null);
        this.cargarHistorialGlobal();
        this.cargarCargos();
      }
    });

    // Debounce búsqueda libre (vista global)
    this.buscarSubject.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((valor) => {
      this.filtros.update((f) => ({ ...f, buscar: valor || undefined }));
      this.pagina.set(0);
      this.cargarHistorialGlobal();
    });

    // Refrescar al guardar cambios en el modal
    this.modalHistorial.guardado$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const mid = this.miembroId();
      if (mid) {
        this.cargarMiembro(mid);
      } else {
        this.cargarHistorialGlobal();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---- Cargas ----
  private cargarMiembro(id: number): void {
    this.cargando.set(true);
    this.miembroService.getMiembroById(id).subscribe({
      next: (m) => {
        // Ordenar historial por fecha de inicio descendente
        if (m.historialCargos) {
          m.historialCargos.sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));
        }
        this.miembro.set(m);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  private cargarHistorialGlobal(): void {
    this.cargando.set(true);
    this.cargoService
      .getCargoHistorial(this.filtros(), this.pagina(), this.tamano())
      .subscribe({
        next: (page) => {
          this.datosGlobal.set(page);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }

  private cargarCargos(): void {
    this.cargoService.getCargos().subscribe({
      next: (p) => this.cargos.set(p.content),
      error: () => {},
    });
  }

  // ---- Filtros (Vista Global) ----
  onBuscarChange(valor: string): void {
    this.buscarSubject.next(valor);
  }

  aplicarFiltro<K extends keyof CargoHistorialFiltros>(
    key: K,
    valor: CargoHistorialFiltros[K]
  ): void {
    this.filtros.update((f) => ({ ...f, [key]: valor || undefined }));
    this.pagina.set(0);
    this.cargarHistorialGlobal();
  }

  limpiarFiltros(): void {
    this.filtros.set({});
    this.pagina.set(0);
    this.cargarHistorialGlobal();
  }

  // ---- Paginación (Vista Global) ----
  irAPagina(p: number | '...'): void {
    if (typeof p !== 'number') return;
    this.pagina.set(p);
    this.cargarHistorialGlobal();
  }

  cambiarTamano(tamano: number): void {
    this.tamano.set(tamano);
    this.pagina.set(0);
    this.cargarHistorialGlobal();
  }

  // ---- Acciones ----
  editar(item: any, isGlobal: boolean): void {
    const miembroId = isGlobal ? item.miembroId : this.miembroId();
    const miembroNombre = isGlobal ? item.miembroNombre : this.miembro()?.nombreRazonSocial;
    const miembroNif = isGlobal ? item.miembroNif : this.miembro()?.nifCif;

    this.modalHistorial.open({
      id: item.id,
      miembroId: miembroId!,
      miembroNombre: miembroNombre!,
      miembroNif: miembroNif,
      fechaInicio: item.fechaInicio,
      fechaFin: item.fechaFin,
      cargoId: isGlobal ? item.cargoId : item.cargo.id,
      isGlobal,
    });
  }

  eliminar(item: any, isGlobal: boolean): void {
    const miembroId = isGlobal ? item.miembroId : this.miembroId();
    const miembroNombre = isGlobal ? item.miembroNombre : this.miembro()?.nombreRazonSocial;
    const cargoNombre = isGlobal ? item.cargoNombre : item.cargo.nombre;

    this.modalConfirm.open({
      titulo: 'Eliminar registro del historial',
      mensaje: `¿Deseas eliminar permanentemente la asignación de "${cargoNombre}" para "${miembroNombre}" iniciada el ${item.fechaInicio}? Esta acción es irreversible.`,
      tipo: 'danger',
      labelConfirmar: 'Eliminar del historial',
      onConfirmar: () => {
        this.miembroService.deleteHistorialCargo(miembroId!, item.id).subscribe({
          next: () => {
            if (isGlobal) {
              this.cargarHistorialGlobal();
            } else {
              this.cargarMiembro(miembroId!);
            }
          },
          error: () => {},
        });
      },
    });
  }

  volverAMiembros(): void {
    this.router.navigate(['/miembros']);
  }
}
