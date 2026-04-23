import { Injectable } from '@angular/core';
import {
  getRemoteConfig,
  fetchAndActivate,
  getValue,
} from '@angular/fire/remote-config';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RemoteConfigService {
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
      const remoteConfig = getRemoteConfig();
      await fetchAndActivate(remoteConfig);
      this.applyRemoteValues(remoteConfig);
    } catch (error) {
      console.error('Failed to refresh Remote Config:', error);
    }
  }

  private applyRemoteValues(remoteConfig: ReturnType<typeof getRemoteConfig>): void {
    const statsValue = getValue(remoteConfig, 'show_task_stats');
    this.showTaskStatsSubject.next(statsValue.asBoolean());

    const categoriesValue = getValue(remoteConfig, 'enable_categories');
    this.enableCategoriesSubject.next(categoriesValue.asBoolean());
  }

  private async loadRemoteConfig(): Promise<void> {
    try {
      const remoteConfig = getRemoteConfig();

      remoteConfig.settings.minimumFetchIntervalMillis = 0;
      remoteConfig.settings.fetchTimeoutMillis = 60000;

      remoteConfig.defaultConfig = {
        show_task_stats: false,
        enable_categories: false,
      };

      await fetchAndActivate(remoteConfig);
      this.applyRemoteValues(remoteConfig);
    } catch (error) {
      console.error('Failed to initialize Remote Config:', error);
      this.showTaskStatsSubject.next(false);
      this.enableCategoriesSubject.next(false);
    }
  }
}
