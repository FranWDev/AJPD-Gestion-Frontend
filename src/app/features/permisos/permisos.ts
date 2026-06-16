import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Router } from '@angular/router';
import { PermisosService } from '../../core/services/permisos.service';
import { AuthService, UserPermissions } from '../../core/services/auth.service';
import { ModalConfirmService } from '../../shared/components/modal-confirm/modal-confirm.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';

@Component({
  selector: 'app-permisos',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonComponent],
  templateUrl: './permisos.html',
  styleUrl: './permisos.css',
})
export class PermisosComponent implements OnInit, OnDestroy {
  private readonly permisosService = inject(PermisosService);
  private readonly authService = inject(AuthService);
  private readonly modalConfirm = inject(ModalConfirmService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly buscarSubject = new Subject<string>();

  readonly permissions = signal<UserPermissions[]>([]);
  readonly cargando = signal(false);
  readonly query = signal('');
  
  readonly pagina = signal(0);
  readonly tamano = signal(10);
  readonly totalElementos = signal(0);
  readonly totalPaginas = signal(0);
  readonly sort = signal<{ campo: string; direccion: 'asc' | 'desc' }>({ campo: 'id', direccion: 'desc' });

  // Modal State
  readonly mostrarModal = signal(false);
  readonly isClosing = signal(false);
  readonly editandoId = signal<number | null>(null);
  readonly formEmail = signal('');
  readonly formCanManagePermissions = signal(false);
  readonly formCanManageOrganization = signal(false);
  readonly formCanManageWeb = signal(false);
  readonly formCanManageFinances = signal(false);
  readonly formError = signal<string | null>(null);
  readonly guardando = signal(false);

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

  readonly sortString = computed(() => `${this.sort().campo},${this.sort().direccion}`);

  ngOnInit(): void {
    this.cargar();

    this.buscarSubject.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(valor => {
      this.query.set(valor || '');
      this.pagina.set(0);
      this.cargar();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargar(): void {
    this.cargando.set(true);
    this.permisosService.getPermissions(
      this.query() || undefined,
      this.pagina(),
      this.tamano(),
      this.sortString()
    ).subscribe({
      next: (page) => {
        this.permissions.set(page.content);
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

  ordenarPor(campo: string): void {
    this.sort.update(s => {
      const nuevo: { campo: string; direccion: 'asc' | 'desc' } = s.campo === campo
        ? { campo, direccion: s.direccion === 'asc' ? 'desc' : 'asc' }
        : { campo, direccion: 'asc' };
      return nuevo;
    });
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
    return s.campo === campo ? s.direccion : '';
  }

  limpiarFiltros(): void {
    this.query.set('');
    this.pagina.set(0);
    this.cargar();
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


  nuevo(): void {
    this.editandoId.set(null);
    this.formEmail.set('');
    this.formCanManagePermissions.set(false);
    this.formCanManageOrganization.set(false);
    this.formCanManageWeb.set(false);
    this.formCanManageFinances.set(false);
    this.formError.set(null);
    this.mostrarModal.set(true);
  }

  onEmailInput(value: string): void {
    if (this.editandoId() === null) {
      const atIndex = value.indexOf('@');
      if (atIndex !== -1) {
        value = value.substring(0, atIndex);
      }
    }
    this.formEmail.set(value);
  }

  editar(perm: UserPermissions): void {
    this.editandoId.set(perm.id ?? null);
    
    // Si estamos editando, mostramos el correo completo pero estará deshabilitado
    this.formEmail.set(perm.email);
    this.formCanManagePermissions.set(perm.canManagePermissions);
    this.formCanManageOrganization.set(perm.canManageOrganization);
    this.formCanManageWeb.set(perm.canManageWeb);
    this.formCanManageFinances.set(perm.canManageFinances);
    this.formError.set(null);
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.isClosing.set(true);
    setTimeout(() => {
      this.mostrarModal.set(false);
      this.isClosing.set(false);
    }, 200);
  }

  guardar(): void {
    let emailStr = this.formEmail().trim().toLowerCase();

    if (!emailStr) {
      this.formError.set('El correo electrónico es requerido.');
      return;
    }

    // Si es una creación nueva, el usuario solo escribe la parte izquierda del correo.
    // Limpiamos cualquier '@' accidental y añadimos el dominio oficial.
    if (this.editandoId() === null) {
      const atIndex = emailStr.indexOf('@');
      if (atIndex !== -1) {
        emailStr = emailStr.substring(0, atIndex);
      }
      emailStr = emailStr + '@proyectodubini.org';
    }

    const payload: UserPermissions = {
      email: emailStr,
      canManagePermissions: this.formCanManagePermissions(),
      canManageOrganization: this.formCanManageOrganization(),
      canManageWeb: this.formCanManageWeb(),
      canManageFinances: this.formCanManageFinances()
    };

    this.guardando.set(true);
    this.formError.set(null);

    const id = this.editandoId();
    if (id !== null) {
      this.permisosService.updatePermission(id, payload).subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrarModal();
          
          // Si el usuario se editó a sí mismo, recargar sus permisos para actualizar el sidebar
          const currentEmail = this.authService.currentUserPermissions()?.email;
          if (currentEmail && currentEmail.toLowerCase() === payload.email.toLowerCase()) {
            this.authService.loadUserPermissions().subscribe(() => {
              if (!payload.canManagePermissions) {
                this.router.navigate(['/']);
              }
            });
          }

          this.cargar();
        },
        error: (err) => {
          this.guardando.set(false);
          const msg = err?.error?.message || 'Error al actualizar la configuración.';
          this.formError.set(msg);
        }
      });
    } else {
      this.permisosService.createPermission(payload).subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrarModal();
          this.cargar();
        },
        error: (err) => {
          this.guardando.set(false);
          const msg = err?.error?.message || 'Error al guardar la configuración.';
          this.formError.set(msg);
        }
      });
    }
  }

  eliminar(perm: UserPermissions): void {
    if (!perm.id) return;
    this.modalConfirm.open({
      titulo: 'Eliminar permisos',
      mensaje: `¿Deseas eliminar permanentemente los permisos del usuario "${perm.email}"?`,
      tipo: 'danger',
      labelConfirmar: 'Eliminar',
      onConfirmar: () => {
        this.permisosService.deletePermission(perm.id!).subscribe({
          next: () => {
            // Si el usuario se eliminó a sí mismo, desloguearlo
            const currentEmail = this.authService.currentUserPermissions()?.email;
            if (currentEmail && currentEmail.toLowerCase() === perm.email.toLowerCase()) {
              this.authService.logout();
              this.router.navigate(['/login']);
            } else {
              this.cargar();
            }
          },
          error: (err) => {
            const msg = err?.error?.message || 'Error al eliminar la configuración.';
            this.modalConfirm.open({
              titulo: 'Error de validación',
              mensaje: msg,
              tipo: 'danger',
              labelConfirmar: 'Aceptar',
              onConfirmar: () => {}
            });
          },
        });
      },
    });
  }
}
