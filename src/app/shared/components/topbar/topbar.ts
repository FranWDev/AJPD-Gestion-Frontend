import { Component, computed, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { LayoutService } from '../../../core/services/layout.service';
import { AuthService } from '../../../core/services/auth.service';

const ROUTE_TITLES: Record<string, string> = {
  '/miembros': 'Miembros',
  '/historial': 'Historial de Cargos',
  '/maestros/centros': 'Centros',
  '/maestros/cargos': 'Cargos',
};

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
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  protected readonly activeTitle = computed(() => {
    const url = this.currentUrl();
    return ROUTE_TITLES[url] ?? 'Panel';
  });

  protected logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
