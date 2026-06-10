import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="dashboard-container">
      <h1>Panel de Control</h1>
      <p>Bienvenido al sistema de gestión de miembros.</p>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
    }
  `]
})
export class DashboardComponent {}
