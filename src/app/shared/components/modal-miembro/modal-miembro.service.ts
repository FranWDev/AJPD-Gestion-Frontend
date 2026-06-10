import { Injectable, signal, computed } from '@angular/core';
import { Subject } from 'rxjs';
import { MiembroResponse } from '../../../core/models/miembro.model';

@Injectable({ providedIn: 'root' })
export class ModalMiembroService {
  private readonly _miembro = signal<MiembroResponse | null>(null);
  private readonly _open = signal(false);

  readonly miembro = this._miembro.asReadonly();
  readonly isOpen = this._open.asReadonly();
  readonly esEdicion = computed(() => this._miembro() !== null);
  readonly guardado$ = new Subject<void>();

  open(miembro?: MiembroResponse): void {
    this._miembro.set(miembro ?? null);
    this._open.set(true);
  }

  cerrar(): void {
    this._open.set(false);
    this._miembro.set(null);
  }
}
