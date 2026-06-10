import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ModalDocumentosService {
  private readonly _miembroId = signal<number | null>(null);
  private readonly _nombre = signal<string>('');
  private readonly _open = signal(false);

  readonly miembroId = this._miembroId.asReadonly();
  readonly nombre = this._nombre.asReadonly();
  readonly isOpen = this._open.asReadonly();

  open(miembroId: number, nombre: string): void {
    this._miembroId.set(miembroId);
    this._nombre.set(nombre);
    this._open.set(true);
  }

  cerrar(): void {
    this._open.set(false);
    this._miembroId.set(null);
    this._nombre.set('');
  }
}
