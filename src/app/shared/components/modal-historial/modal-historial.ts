import { Component, inject, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ModalHistorialService } from './modal-historial.service';
import { CargoService } from '../../../core/services/cargo.service';
import { MiembroService } from '../../../core/services/miembro.service';
import { CargoRef } from '../../../core/models/miembro.model';

@Component({
  selector: 'app-modal-historial',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './modal-historial.html',
  styleUrl: './modal-historial.css',
})
export class ModalHistorialComponent {
  protected readonly svc = inject(ModalHistorialService);
  private readonly cargoService = inject(CargoService);
  private readonly miembroService = inject(MiembroService);

  protected readonly cargos = signal<CargoRef[]>([]);
  protected readonly guardando = signal(false);
  protected readonly errorGuardar = signal<string | null>(null);

  protected readonly form = signal<{
    fechaInicio: string;
    fechaFin: string | null;
    cargoId: number | null;
  }>({
    fechaInicio: '',
    fechaFin: null,
    cargoId: null,
  });

  constructor() {
    effect(() => {
      const data = this.svc.data();
      if (this.svc.isOpen() && data) {
        this.cargarCargos();
        this.form.set({
          fechaInicio: data.fechaInicio,
          fechaFin: data.fechaFin ?? null,
          cargoId: data.cargoId,
        });
        this.errorGuardar.set(null);
      }
    });
  }

  private cargarCargos(): void {
    this.cargoService.getCargos().subscribe({
      next: (p) => this.cargos.set(p.content),
      error: () => {},
    });
  }

  protected updateField<K extends 'fechaInicio' | 'fechaFin' | 'cargoId'>(
    key: K,
    value: any
  ): void {
    this.form.update((f) => ({ ...f, [key]: value || null }));
  }

  protected guardar(): void {
    const f = this.form();
    const data = this.svc.data();
    if (!data) return;

    if (!f.fechaInicio) {
      this.errorGuardar.set('La fecha de inicio es obligatoria.');
      return;
    }
    if (f.cargoId == null) {
      this.errorGuardar.set('El cargo es obligatorio.');
      return;
    }

    this.guardando.set(true);
    this.errorGuardar.set(null);

    const obs: Observable<any> = data.isGlobal
      ? this.cargoService.updateCargoHistorial(data.id, {
          fechaInicio: f.fechaInicio,
          fechaFin: f.fechaFin,
          cargoId: f.cargoId,
        })
      : this.miembroService.updateHistorialCargo(data.miembroId, data.id, {
          fechaInicio: f.fechaInicio,
          fechaFin: f.fechaFin,
          cargo: { id: f.cargoId },
        });

    obs.subscribe({
      next: () => {
        this.guardando.set(false);
        this.svc.cerrar();
        this.svc.guardado$.next();
      },
      error: (err: any) => {
        this.guardando.set(false);
        this.errorGuardar.set(err?.error?.message ?? 'Error al guardar el historial.');
      },
    });
  }
}
