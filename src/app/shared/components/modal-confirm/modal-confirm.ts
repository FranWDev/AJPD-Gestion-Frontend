import { Component, inject } from '@angular/core';
import { ModalConfirmService } from './modal-confirm.service';

@Component({
  selector: 'app-modal-confirm',
  standalone: true,
  imports: [],
  templateUrl: './modal-confirm.html',
  styleUrl: './modal-confirm.css',
})
export class ModalConfirmComponent {
  protected readonly svc = inject(ModalConfirmService);
}
