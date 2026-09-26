import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'tasky-theme';
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  theme = signal<Theme>(this.isBrowser ? this.getInitialTheme() : 'light');

  constructor() {
    effect(() => {
      if (!this.isBrowser) return;
      const value = this.theme();
      document.documentElement.setAttribute('data-bs-theme', value);
      localStorage.setItem(this.storageKey, value);
    });
  }

  toggle(): void {
    this.theme.set(this.theme() === 'light' ? 'dark' : 'light');
  }

 private getInitialTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (saved) return saved;

    // Vérifie si matchMedia existe avant d'appeler la fonction
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
  }
  return 'light';
}
}