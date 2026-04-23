import { Injectable, inject } from '@angular/core';
import {
  RemoteConfig,
  fetchAndActivate,
  getValue,
  getAll,
} from '@angular/fire/remote-config';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RemoteConfigService {
  private readonly remoteConfig = inject(RemoteConfig);

  private readonly showTaskStatsSubject = new BehaviorSubject<boolean>(false);
  readonly showTaskStats$: Observable<boolean> =
    this.showTaskStatsSubject.asObservable();

  private readonly enableCategoriesSubject = new BehaviorSubject<boolean>(false);
  readonly enableCategories$: Observable<boolean> =
    this.enableCategoriesSubject.asObservable();

  private initPromise: Promise<void> | null = null;

  constructor() {}

  /**
   * Idempotent: safe to call from App bootstrap and route guards.
   */
  ensureInitialized(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.loadRemoteConfig();
    }
    return this.initPromise;
  }

  /** @deprecated Prefer {@link ensureInitialized} for clarity. */
  async init(): Promise<void> {
    return this.ensureInitialized();
  }

  areCategoriesEnabled(): boolean {
    return this.enableCategoriesSubject.getValue();
  }

  /**
   * Manually refresh remote config values from Firebase
   */
  async refresh(): Promise<void> {
    try {
      await fetchAndActivate(this.remoteConfig);
      this.applyRemoteValues();
    } catch (error) {
      console.error('Failed to refresh Remote Config:', error);
    }
  }

  private applyRemoteValues(): void {
    const allParams = getAll(this.remoteConfig);
    const paramsSummary: Record<string, { value: string; source: string }> = {};
    Object.entries(allParams).forEach(([k, v]) => { paramsSummary[k] = { value: v.asString(), source: v.getSource() }; });
    console.log('[RemoteConfig] todos los parámetros recibidos:', JSON.stringify(paramsSummary));

    const statsValue = getValue(this.remoteConfig, 'show_task_stats');
    this.showTaskStatsSubject.next(statsValue.asBoolean());

    const categoriesValue = getValue(this.remoteConfig, 'enable_categories');
    console.log('[RemoteConfig] enable_categories → valor:', categoriesValue.asString(), '| source:', categoriesValue.getSource(), '| boolean:', categoriesValue.asBoolean());
    this.enableCategoriesSubject.next(categoriesValue.asBoolean());
  }

  private async loadRemoteConfig(): Promise<void> {
    try {
      this.remoteConfig.settings.minimumFetchIntervalMillis = 0;
      this.remoteConfig.settings.fetchTimeoutMillis = 60000;

      this.remoteConfig.defaultConfig = {
        show_task_stats: false,
        enable_categories: false,
      };

      console.log('[RemoteConfig] iniciando fetchAndActivate...');
      const activated = await fetchAndActivate(this.remoteConfig);
      console.log('[RemoteConfig] fetchAndActivate completado. ¿Nuevos valores activados?', activated);
      this.applyRemoteValues();
    } catch (error) {
      console.error('[RemoteConfig] ERROR en inicialización:', error);
      this.showTaskStatsSubject.next(false);
      this.enableCategoriesSubject.next(false);
    }
  }
}
