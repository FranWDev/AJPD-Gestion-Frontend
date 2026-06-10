import { Component } from '@angular/core';

@Component({
  selector: 'app-centros',
  standalone: true,
  template: `
    <div class="placeholder-page">
      <h1>Centros</h1>
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
export class CentrosComponent {}
