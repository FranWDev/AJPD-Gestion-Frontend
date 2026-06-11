import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LayoutService } from '../../../core/services/layout.service';
import { AuthService } from '../../../core/services/auth.service';
import { ModalConfirmService } from '../modal-confirm/modal-confirm.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class TopBarComponent {
  protected readonly layoutService = inject(LayoutService);
  private readonly authService = inject(AuthService);
  private readonly modalConfirm = inject(ModalConfirmService);
  private readonly router = inject(Router);

  protected logout(): void {
    this.modalConfirm.open({
      titulo: 'Cerrar sesión',
      mensaje: '¿Estás seguro de que deseas cerrar tu sesión en la aplicación?',
      tipo: 'danger',
      labelConfirmar: 'Cerrar sesión',
      onConfirmar: () => {
        this.authService.logout();
        this.router.navigate(['/login']);
      },
    });
  }
}
