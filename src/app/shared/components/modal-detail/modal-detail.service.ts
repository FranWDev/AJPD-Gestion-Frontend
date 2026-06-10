import { Injectable, signal, computed } from '@angular/core';
import { MiembroResponse } from '../../../core/models/miembro.model';

@Injectable({ providedIn: 'root' })
export class ModalDetailService {
  private readonly _miembro = signal<MiembroResponse | null>(null);
  readonly miembro = this._miembro.asReadonly();
  readonly isOpen = computed(() => this._miembro() !== null);

  open(miembro: MiembroResponse): void {
    this._miembro.set(miembro);
  }

  cerrar(): void {
    this._miembro.set(null);
  }
}
