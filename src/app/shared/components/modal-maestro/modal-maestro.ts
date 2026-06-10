import { Component, inject, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ModalMaestroService } from './modal-maestro.service';
import { CentroService } from '../../../core/services/centro.service';
import { CargoService } from '../../../core/services/cargo.service';

@Component({
  selector: 'app-modal-maestro',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './modal-maestro.html',
  styleUrl: './modal-maestro.css',
})
export class ModalMaestroComponent {
  protected readonly svc = inject(ModalMaestroService);
  private readonly centroService = inject(CentroService);
  private readonly cargoService = inject(CargoService);

  protected readonly guardando = signal(false);
  protected readonly errorGuardar = signal<string | null>(null);

  protected readonly nombre = signal('');

  constructor() {
    effect(() => {
      if (this.svc.isOpen()) {
        this.nombre.set(this.svc.nombre());
        this.errorGuardar.set(null);
      }
    });
  }

  protected updateNombre(val: string): void {
    this.nombre.set(val);
  }

  protected guardar(): void {
    const val = this.nombre().trim();
    if (!val) {
      this.errorGuardar.set('El nombre es obligatorio.');
      return;
    }

    this.guardando.set(true);
    this.errorGuardar.set(null);

    const tipo = this.svc.tipo();
    const id = this.svc.id();
    
    let obs: Observable<any>;

    if (tipo === 'centro') {
      obs = id
        ? this.centroService.updateCentro(id, val)
        : this.centroService.createCentro(val);
    } else {
      obs = id
        ? this.cargoService.updateCargo(id, val)
        : this.cargoService.createCargo(val);
    }

    obs.subscribe({
      next: () => {
        this.guardando.set(false);
        this.svc.cerrar();
        this.svc.guardado$.next();
      },
      error: (err: any) => {
        this.guardando.set(false);
        this.errorGuardar.set(err?.error?.message ?? `Error al guardar el ${tipo}.`);
      },
    });
  }
}
