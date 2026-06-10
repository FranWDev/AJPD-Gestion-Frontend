import { Component } from '@angular/core';

@Component({
  selector: 'app-historial',
  standalone: true,
  template: `
    <div class="placeholder-page">
      <h1>Historial de Cargos</h1>
      <p>Sección en construcción.</p>
    </div>
  `,
  styles: [`
    .placeholder-page {
      padding: 32px;
      color: var(--color-text-secondary);
    }
    h1 { font-size: 1.5rem; margin-bottom: 8px; color: var(--color-text-primary); }
  `]
})
export class HistorialComponent {}
