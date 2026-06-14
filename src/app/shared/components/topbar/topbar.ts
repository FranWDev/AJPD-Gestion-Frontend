import { Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LayoutService } from '../../../core/services/layout.service';
import { AuthService } from '../../../core/services/auth.service';
import { ModalConfirmService } from '../modal-confirm/modal-confirm.service';
import { PwaService } from '../../../core/services/pwa.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class TopBarComponent {
  protected readonly layoutService = inject(LayoutService);
  protected readonly pwaService = inject(PwaService);
  private readonly authService = inject(AuthService);
  private readonly modalConfirm = inject(ModalConfirmService);
  private readonly router = inject(Router);

  protected readonly currentUrl = signal(this.router.url);

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.currentUrl.set(event.urlAfterRedirects || event.url);
    });
  }

  protected get currentSectionName(): string {
    const url = this.currentUrl();
    if (url.includes('/web/noticias')) return 'Noticias';
    if (url.includes('/web/hero')) return 'Imágenes Hero';
    if (url.includes('/web/slider')) return 'Slider';
    if (url.includes('/web/dashboard')) return 'Administración Web';
    if (url.includes('/miembros')) return 'Miembros';
    if (url.includes('/maestros/cargos')) return 'Cargos';
    if (url.includes('/maestros/centros')) return 'Centros';
    if (url.includes('/historial')) return 'Historial';
    return '';
  }

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
