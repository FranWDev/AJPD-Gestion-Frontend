import { Injectable, signal, computed } from '@angular/core';

export interface ConfirmConfig {
  titulo: string;
  mensaje: string;
  tipo?: 'danger' | 'warning' | 'info';
  labelConfirmar?: string;
  labelCancelar?: string;
  onConfirmar: () => void;
}

@Injectable({ providedIn: 'root' })
export class ModalConfirmService {
  private readonly _config = signal<ConfirmConfig | null>(null);

  readonly config = this._config.asReadonly();
  readonly isOpen = computed(() => this._config() !== null);

  open(config: ConfirmConfig): void {
    this._config.set(config);
  }

  confirmar(): void {
    this._config()?.onConfirmar();
    this._config.set(null);
  }

  cerrar(): void {
    this._config.set(null);
  }
}
