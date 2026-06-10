import { Component, inject, output } from '@angular/core';
import { ModalDetailService } from './modal-detail.service';
import { ModalMiembroService } from '../modal-miembro/modal-miembro.service';

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

  readonly editarClick = output<void>();
  readonly bajaClick = output<void>();

  protected editar(): void {
    const m = this.svc.miembro();
    if (!m) return;
    this.svc.cerrar();
    this.modalMiembro.open(m);
  }
}
