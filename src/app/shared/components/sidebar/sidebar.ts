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

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Gestión de Organización',
    items: [
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
    ],
  },
  {
    title: 'Gestión de Contenidos',
    items: [
      {
        label: 'Publicaciones',
        route: '/web/noticias',
        svgPath: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z',
      },
      {
        label: 'Imágenes Hero',
        route: '/web/hero',
        svgPath: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
      },
      {
        label: 'Slider',
        route: '/web/slider',
        svgPath: 'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-3.75 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
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
  protected readonly navSections = NAV_SECTIONS;
  protected readonly openGroups = signal<Record<string, boolean>>({ 'Datos Maestros': true });

  @HostListener('click', ['$event'])
  protected onSidebarClick(event: MouseEvent): void {
    if (this.layoutService.sidebarCollapsed()) {
      event.stopPropagation();
      this.layoutService.expandSidebar();
    }
  }

  protected isGroupOpen(label: string): boolean {
    return !!this.openGroups()[label];
  }

  protected toggleGroup(label: string): void {
    if (this.layoutService.sidebarCollapsed()) {
      this.layoutService.toggleSidebar();
      this.openGroups.update(groups => ({ ...groups, [label]: true }));
      return;
    }
    this.openGroups.update(groups => ({
      ...groups,
      [label]: !groups[label]
    }));
  }

  protected toggleSidebar(event: MouseEvent): void {
    event.stopPropagation();
    this.layoutService.toggleSidebar();
  }

  protected onNavClick(): void {
    this.layoutService.closeMobileDrawer();
  }
}
