import { Component, inject } from '@angular/core';
import { ModalDocumentosService } from './modal-documentos.service';

@Component({
  selector: 'app-modal-documentos',
  standalone: true,
  imports: [],
  templateUrl: './modal-documentos.html',
  styleUrl: './modal-documentos.css',
})
export class ModalDocumentosComponent {
  protected readonly svc = inject(ModalDocumentosService);
}
