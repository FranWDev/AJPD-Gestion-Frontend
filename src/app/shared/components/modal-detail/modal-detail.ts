import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ModalDetailService } from './modal-detail.service';
import { ModalMiembroService } from '../modal-miembro/modal-miembro.service';
import { ModalConfirmService } from '../modal-confirm/modal-confirm.service';
import { ModalDocumentosService } from '../modal-documentos/modal-documentos.service';
import { MiembroService } from '../../../core/services/miembro.service';

@Component({
  selector: 'app-modal-detail',
  standalone: true,
  imports: [],
  templateUrl: './modal-detail.html',
  styleUrl: './modal-detail.css',
})
export class ModalDetailComponent {
  protected readonly svc = inject(ModalDetailService);
  private readonly modalMiembro = inject(ModalMiembroService);
  private readonly modalConfirm = inject(ModalConfirmService);
  private readonly modalDocumentos = inject(ModalDocumentosService);
  private readonly miembroService = inject(MiembroService);
  private readonly router = inject(Router);

  protected editar(): void {
    const m = this.svc.miembro();
    if (!m) return;
    this.svc.cerrar();
    this.modalMiembro.open(m);
  }

  protected verDocumentos(): void {
    const m = this.svc.miembro();
    if (!m) return;
    this.svc.cerrar();
    this.modalDocumentos.open(m.id, m.nombreRazonSocial);
  }

  protected verHistorial(): void {
    const m = this.svc.miembro();
    if (!m) return;
    this.svc.cerrar();
    this.router.navigate(['/organizacion/historial'], { queryParams: { miembroId: m.id } });
  }

  protected darDeBaja(): void {
    const m = this.svc.miembro();
    if (!m) return;
    this.modalConfirm.open({
      titulo: 'Dar de baja al miembro',
      mensaje: `¿Deseas dar de baja a "${m.nombreRazonSocial}"? Esta accion puede revertirse.`,
      tipo: 'warning',
      labelConfirmar: 'Dar de baja',
      onConfirmar: () => {
        this.miembroService.darDeBaja(m.id).subscribe({
          next: () => {
            this.svc.cerrar();
            this.modalMiembro.guardado$.next();
          },
          error: () => {},
        });
      },
    });
  }

  protected revertirBaja(): void {
    const m = this.svc.miembro();
    if (!m) return;
    this.modalConfirm.open({
      titulo: 'Revertir baja',
      mensaje: `¿Deseas reactivar a "${m.nombreRazonSocial}" como miembro activo?`,
      tipo: 'info',
      labelConfirmar: 'Reactivar',
      onConfirmar: () => {
        this.miembroService.reactivar(m.id).subscribe({
          next: () => {
            this.svc.cerrar();
            this.modalMiembro.guardado$.next();
          },
          error: () => {},
        });
      },
    });
  }

  protected eliminar(): void {
    const m = this.svc.miembro();
    if (!m) return;
    this.modalConfirm.open({
      titulo: 'Eliminar miembro',
      mensaje: `Esta accion es permanente e irreversible. ¿Confirmas eliminar a "${m.nombreRazonSocial}"?`,
      tipo: 'danger',
      labelConfirmar: 'Eliminar definitivamente',
      onConfirmar: () => {
        this.miembroService.deleteMiembro(m.id).subscribe({
          next: () => {
            this.svc.cerrar();
            this.modalMiembro.guardado$.next();
          },
          error: () => {},
        });
      },
    });
  }

  protected esBaja(): boolean {
    const m = this.svc.miembro();
    return !!m?.fechaBaja;
  }
}
