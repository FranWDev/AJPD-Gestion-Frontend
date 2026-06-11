import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    // Escuchar parámetros de la URL para detectar el token o errores de redirección
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const error = params['error'];

      if (token) {
        this.isLoading.set(true);
        this.authService.saveToken(token);
        this.isLoading.set(false);
        this.router.navigate(['/']);
      } else if (error) {
        this.errorMessage.set(error);
      }
    });
  }

  loginWithGoogle(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    window.location.href = `${environment.apiUrl}/oauth2/authorization/google`;
  }
}
