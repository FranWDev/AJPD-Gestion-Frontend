import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { ModalService } from '../services/modal.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly modalService = inject(ModalService);
  private readonly zone = inject(NgZone);

  handleError(error: any): void {
    // Imprimir en consola para depuración
    console.error('Error global capturado:', error);

    const message = error instanceof Error ? error.message : String(error);

    // Ejecutar dentro de la zona de Angular si es necesario (para compatibilidad de cambios reactivos)
    this.zone.run(() => {
      this.modalService.showError(
        'Se ha producido un error inusual',
        message || 'Ocurrió un error inesperado en la aplicación.'
      );
    });
  }
}
