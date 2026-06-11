import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { CargoService } from '../../../core/services/cargo.service';
import { ModalMaestroService } from '../../../shared/components/modal-maestro/modal-maestro.service';
import { ModalConfirmService } from '../../../shared/components/modal-confirm/modal-confirm.service';
import { CargoRef } from '../../../core/models/miembro.model';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton';

@Component({
  selector: 'app-cargos',
  standalone: true,
  imports: [SkeletonComponent],
  templateUrl: './cargos.html',
  styleUrl: './cargos.css',
})
export class CargosComponent implements OnInit, OnDestroy {
  private readonly cargoService = inject(CargoService);
  private readonly modalMaestro = inject(ModalMaestroService);
  private readonly modalConfirm = inject(ModalConfirmService);
  private readonly destroy$ = new Subject<void>();
  private readonly buscarSubject = new Subject<string>();

  readonly cargos = signal<CargoRef[]>([]);
  readonly cargando = signal(false);

  // Paginación y búsqueda
  readonly buscar = signal<string | undefined>(undefined);
  readonly pagina = signal(0);
  readonly tamano = signal(10);
  readonly totalElementos = signal(0);
  readonly totalPaginas = signal(0);
  readonly sort = signal({ campo: 'nombre', direccion: 'asc' });

  readonly sortString = computed(() => `${this.sort().campo},${this.sort().direccion}`);

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
    this.cargar();

    // Debounce de búsqueda
    this.buscarSubject.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(valor => {
      this.buscar.set(valor || undefined);
      this.pagina.set(0);
      this.cargar();
    });

    // Recargar cuando se guarda un cargo
    this.modalMaestro.guardado$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.modalMaestro.tipo() === 'cargo') {
        this.cargar();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargar(): void {
    this.cargando.set(true);
    this.cargoService.getCargos(this.buscar(), this.pagina(), this.tamano(), this.sortString()).subscribe({
      next: (page) => {
        this.cargos.set(page.content);
        this.totalElementos.set(page.totalElements);
        this.totalPaginas.set(page.totalPages);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  onBuscarChange(valor: string): void {
    this.buscarSubject.next(valor);
  }

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

  ordenarPor(campo: string): void {
    this.sort.update(s =>
      s.campo === campo
        ? { campo, direccion: s.direccion === 'asc' ? 'desc' : 'asc' }
        : { campo, direccion: 'asc' }
    );
    this.pagina.set(0);
    this.cargar();
  }

  ordenarPorMobile(valor: string): void {
    const parts = valor.split(',');
    if (parts.length === 2) {
      const campo = parts[0];
      const direccion = parts[1] as 'asc' | 'desc';
      this.sort.set({ campo, direccion });
      this.pagina.set(0);
      this.cargar();
    }
  }

  iconoSort(campo: string): 'asc' | 'desc' | '' {
    const s = this.sort();
    return s.campo === campo ? (s.direccion as 'asc' | 'desc') : '';
  }

  tieneFiltrosActivos(): boolean {
    return !!this.buscar();
  }

  limpiarFiltros(): void {
    this.buscar.set(undefined);
    this.pagina.set(0);
    this.cargar();
  }

  nuevo(): void {
    this.modalMaestro.open('cargo');
  }

  editar(cargo: CargoRef): void {
    this.modalMaestro.open('cargo', cargo.id, cargo.nombre);
  }

  eliminar(cargo: CargoRef): void {
    this.modalConfirm.open({
      titulo: 'Eliminar cargo',
      mensaje: `¿Deseas eliminar permanentemente el cargo "${cargo.nombre}"? Esta acción solo es posible si ningún miembro ni historial tiene registrado este cargo.`,
      tipo: 'danger',
      labelConfirmar: 'Eliminar',
      onConfirmar: () => {
        this.cargoService.deleteCargo(cargo.id).subscribe({
          next: () => this.cargar(),
          error: () => {},
        });
      },
    });
  }
}
