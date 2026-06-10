import { Injectable, signal, computed } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ModalMaestroService {
  private readonly _tipo = signal<'centro' | 'cargo'>('centro');
  private readonly _id = signal<number | null>(null);
  private readonly _nombre = signal<string>('');
  private readonly _open = signal(false);

  readonly tipo = this._tipo.asReadonly();
  readonly id = this._id.asReadonly();
  readonly nombre = this._nombre.asReadonly();
  readonly isOpen = this._open.asReadonly();
  readonly esEdicion = computed(() => this._id() !== null);
  readonly guardado$ = new Subject<void>();

  open(tipo: 'centro' | 'cargo', id?: number, nombre?: string): void {
    this._tipo.set(tipo);
    this._id.set(id ?? null);
    this._nombre.set(nombre ?? '');
    this._open.set(true);
  }

  cerrar(): void {
    this._open.set(false);
    this._id.set(null);
    this._nombre.set('');
  }
}
