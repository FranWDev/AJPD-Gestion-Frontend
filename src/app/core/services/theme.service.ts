import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>('light');

  constructor() {
    effect(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
  }

  toggle(): void {
    // No-op: theme is forced to light
  }
}
