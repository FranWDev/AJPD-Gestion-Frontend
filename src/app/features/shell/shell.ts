import { Component, inject, HostListener, ElementRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
import { TopBarComponent } from '../../shared/components/topbar/topbar';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopBarComponent],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class ShellComponent {
  protected readonly layoutService = inject(LayoutService);
  private readonly elementRef = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (window.innerWidth >= 768 && !this.layoutService.sidebarCollapsed()) {
      const sidebarEl = this.elementRef.nativeElement.querySelector('.shell-sidebar');
      // Si el click no ha sido dentro del sidebar, la colapsamos
      if (sidebarEl && !sidebarEl.contains(event.target as Node)) {
        this.layoutService.collapseSidebar();
      }
    }
  }
}
