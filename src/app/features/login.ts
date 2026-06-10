import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="login-container">
      <h1>AJPD Gestión de Miembros</h1>
      <p>Inicializando pantalla de login...</p>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background-color: var(--color-background);
    }
  `]
})
export class LoginComponent {}
