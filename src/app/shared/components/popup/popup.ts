import { Component, inject } from '@angular/core';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-popup',
  standalone: true,
  templateUrl: './popup.html',
  styleUrl: './popup.css'
})
export class PopupComponent {
  readonly modalService = inject(ModalService);

  close(): void {
    this.modalService.close();
  }
}
