import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login').then(m => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/shell/shell').then(m => m.ShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'miembros',
        pathMatch: 'full',
      },
      {
        path: 'miembros',
        loadComponent: () =>
          import('./features/miembros/miembros').then(m => m.MiembrosComponent),
      },
      {
        path: 'historial',
        loadComponent: () =>
          import('./features/historial/historial').then(m => m.HistorialComponent),
      },
      {
        path: 'maestros/centros',
        loadComponent: () =>
          import('./features/maestros/centros/centros').then(m => m.CentrosComponent),
      },
      {
        path: 'maestros/cargos',
        loadComponent: () =>
          import('./features/maestros/cargos/cargos').then(m => m.CargosComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
