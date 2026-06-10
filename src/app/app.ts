import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PopupComponent } from './shared/components/popup/popup';
import { ModalConfirmComponent } from './shared/components/modal-confirm/modal-confirm';
import { ModalMiembroComponent } from './shared/components/modal-miembro/modal-miembro';
import { ModalDetailComponent } from './shared/components/modal-detail/modal-detail';
import { ModalDocumentosComponent } from './shared/components/modal-documentos/modal-documentos';
import { ModalHistorialComponent } from './shared/components/modal-historial/modal-historial';
import { ModalMaestroComponent } from './shared/components/modal-maestro/modal-maestro';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    PopupComponent,
    ModalConfirmComponent,
    ModalMiembroComponent,
    ModalDetailComponent,
    ModalDocumentosComponent,
    ModalHistorialComponent,
    ModalMaestroComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('ajpd-front');
}
