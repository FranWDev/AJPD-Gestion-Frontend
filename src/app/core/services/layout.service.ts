import { Injectable, signal } from '@angular/core';

const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly sidebarCollapsed = signal<boolean>(
    localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );

  readonly mobileDrawerOpen = signal(false);

  toggleSidebar(): void {
    if (window.innerWidth < 768) {
      this.mobileDrawerOpen.update(v => !v);
    } else {
      const next = !this.sidebarCollapsed();
      this.sidebarCollapsed.set(next);
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
    }
  }

  expandSidebar(): void {
    if (window.innerWidth >= 768 && this.sidebarCollapsed()) {
      this.sidebarCollapsed.set(false);
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, 'false');
    }
  }

  collapseSidebar(): void {
    if (window.innerWidth >= 768 && !this.sidebarCollapsed()) {
      this.sidebarCollapsed.set(true);
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, 'true');
    }
  }

  closeMobileDrawer(): void {
    this.mobileDrawerOpen.set(false);
  }
}
