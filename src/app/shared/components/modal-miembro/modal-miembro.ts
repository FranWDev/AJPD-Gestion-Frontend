import { Component, inject, signal, computed, output, OnChanges, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalMiembroService } from './modal-miembro.service';
import { MiembroService } from '../../../core/services/miembro.service';
import { CentroService } from '../../../core/services/centro.service';
import { CargoService } from '../../../core/services/cargo.service';
import { MiembroRequest, CentroRef, CargoRef } from '../../../core/models/miembro.model';

@Component({
  selector: 'app-modal-miembro',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './modal-miembro.html',
  styleUrl: './modal-miembro.css',
})
export class ModalMiembroComponent {
  protected readonly svc = inject(ModalMiembroService);
  private readonly miembroService = inject(MiembroService);
  private readonly centroService = inject(CentroService);
  private readonly cargoService = inject(CargoService);

  readonly guardado = output<void>();

  protected readonly centros = signal<CentroRef[]>([]);
  protected readonly cargos = signal<CargoRef[]>([]);
  protected readonly guardando = signal(false);
  protected readonly errorGuardar = signal<string | null>(null);

  protected readonly nacionalidades = [
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

  protected readonly nacionalidad1 = signal<string>('');
  protected readonly nacionalidad2 = signal<string>('');

  protected readonly form = signal<MiembroRequest>({
    nombreRazonSocial: '',
    centroId: null,
    telefono: '',
    correo: '',
    cargoId: null,
    fechaCargo: null,
    enlaceWhatsapp: '',
    nifCif: '',
    nacionalidad: '',
    domicilio: '',
    fechaNacimiento: null,
    fechaAlta: null,
    observaciones: '',
  });

  constructor() {
    effect(() => {
      if (this.svc.isOpen()) {
        this.cargarOpciones();
        const m = this.svc.miembro();
        if (m) {
          const parts = (m.nacionalidad || '').split(' y ');
          this.nacionalidad1.set(parts[0] || '');
          this.nacionalidad2.set(parts[1] || '');
          this.form.set({
            nombreRazonSocial: m.nombreRazonSocial,
            centroId: m.centro?.id ?? null,
            telefono: m.telefono ?? '',
            correo: m.correo ?? '',
            cargoId: m.cargo?.id ?? null,
            fechaCargo: m.fechaCargo ?? null,
            enlaceWhatsapp: m.enlaceWhatsapp ?? '',
            nifCif: m.nifCif ?? '',
            nacionalidad: m.nacionalidad ?? '',
            domicilio: m.domicilio ?? '',
            fechaNacimiento: m.fechaNacimiento ?? null,
            fechaAlta: m.fechaAlta ?? null,
            observaciones: m.observaciones ?? '',
          });
        } else {
          this.nacionalidad1.set('');
          this.nacionalidad2.set('');
          this.form.set({
            nombreRazonSocial: '',
            centroId: null,
            telefono: '',
            correo: '',
            cargoId: null,
            fechaCargo: null,
            enlaceWhatsapp: '',
            nifCif: '',
            nacionalidad: '',
            domicilio: '',
            fechaNacimiento: null,
            fechaAlta: null,
            observaciones: '',
          });
        }
        this.errorGuardar.set(null);
      }
    });
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

  protected updateField<K extends keyof MiembroRequest>(key: K, value: MiembroRequest[K]): void {
    this.form.update(f => ({ ...f, [key]: value || null }));
  }

  protected guardar(): void {
    const f = this.form();
    if (!f.nombreRazonSocial?.trim()) {
      this.errorGuardar.set('El nombre es obligatorio.');
      return;
    }

    const n1 = this.nacionalidad1();
    const n2 = this.nacionalidad2();
    let combined = '';
    if (n1 && n2) {
      combined = `${n1} y ${n2}`;
    } else if (n1) {
      combined = n1;
    } else if (n2) {
      combined = n2;
    }
    f.nacionalidad = combined;
    this.guardando.set(true);
    this.errorGuardar.set(null);

    const miembro = this.svc.miembro();
    const obs = miembro
      ? this.miembroService.updateMiembro(miembro.id, f)
      : this.miembroService.createMiembro(f);

    obs.subscribe({
      next: () => {
        this.guardando.set(false);
        this.svc.cerrar();
        this.svc.guardado$.next();
      },
      error: (err: any) => {
        this.guardando.set(false);
        this.errorGuardar.set(err?.error?.message ?? 'Error al guardar el miembro.');
      },
    });
  }
}
