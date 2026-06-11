import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'ajpd-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.loadTheme());

  constructor() {
    // Apply the theme to <html> whenever it changes
    effect(() => {
      const t = this.theme();
      document.documentElement.setAttribute('data-theme', t);
      try { localStorage.setItem(STORAGE_KEY, t); } catch { /* noop */ }
    });
  }

  toggle(): void {
    this.theme.update(t => (t === 'light' ? 'dark' : 'light'));
  }

  private loadTheme(): Theme {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === 'dark' || stored === 'light') return stored;
    } catch { /* noop */ }
    // Respect OS preference as fallback
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
