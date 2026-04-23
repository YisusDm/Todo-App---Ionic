import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

const STORAGE_KEY = 'app-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly isDarkSubject = new BehaviorSubject<boolean>(this.resolveInitial());
  readonly isDark$: Observable<boolean> = this.isDarkSubject.asObservable();

  constructor() {
    this.apply(this.isDarkSubject.getValue());
  }

  toggle(): void {
    const next = !this.isDarkSubject.getValue();
    this.isDarkSubject.next(next);
    localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    this.apply(next);
  }

  get isDark(): boolean {
    return this.isDarkSubject.getValue();
  }

  private resolveInitial(): boolean {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private apply(isDark: boolean): void {
    const body = document.body;
    if (isDark) {
      body.classList.add('theme-dark', 'ion-palette-dark');
      body.classList.remove('theme-light');
    } else {
      body.classList.add('theme-light');
      body.classList.remove('theme-dark', 'ion-palette-dark');
    }
  }
}
