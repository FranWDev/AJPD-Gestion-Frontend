import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../../../core/services/layout.service';

interface NavChild {
  label: string;
  route: string;
  svgPath: string;
}

interface NavItem {
  label: string;
  svgPath: string;
  route?: string;
  children?: NavChild[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Miembros',
    route: '/miembros',
    svgPath:
      'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z',
  },
  {
    label: 'Historial de Cargos',
    route: '/historial',
    svgPath:
      'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
  {
    label: 'Datos Maestros',
    svgPath:
      'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125',
    children: [
      {
        label: 'Centros',
        route: '/maestros/centros',
        svgPath:
          'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z',
      },
      {
        label: 'Cargos',
        route: '/maestros/cargos',
        svgPath:
          'M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z',
      },
    ],
  },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  protected readonly layoutService = inject(LayoutService);
  protected readonly navItems = NAV_ITEMS;
  protected readonly openGroup = signal<string | null>('Datos Maestros');

  @HostListener('click', ['$event'])
  protected onSidebarClick(event: MouseEvent): void {
    if (this.layoutService.sidebarCollapsed()) {
      // Evita que el click se propague al documento (que causaría un colapso inmediato de vuelta)
      event.stopPropagation();
      this.layoutService.expandSidebar();
    }
  }

  protected toggleGroup(label: string): void {
    if (this.layoutService.sidebarCollapsed()) {
      this.layoutService.toggleSidebar();
      this.openGroup.set(label);
      return;
    }
    this.openGroup.update(current => (current === label ? null : label));
  }

  protected toggleSidebar(event: MouseEvent): void {
    event.stopPropagation();
    this.layoutService.toggleSidebar();
  }

  protected onNavClick(): void {
    this.layoutService.closeMobileDrawer();
  }
}
