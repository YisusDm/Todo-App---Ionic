import { Injectable } from '@angular/core';
import { getRemoteConfig, fetchAndActivate, getValue } from '@angular/fire/remote-config';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RemoteConfigService {
  private showTaskStatsSubject = new BehaviorSubject<boolean>(false);
  showTaskStats$: Observable<boolean> = this.showTaskStatsSubject.asObservable();

  constructor() {}

  async init(): Promise<void> {
    try {
      const remoteConfig = getRemoteConfig();

      // Development: fetch immediately, Production: 3600 seconds (1 hour)
      remoteConfig.settings.minimumFetchIntervalMillis = 0;
      remoteConfig.settings.fetchTimeoutMillis = 60000;

      // Set default values
      remoteConfig.defaultConfig = {
        show_task_stats: false,
      };

      // Fetch and activate remote config
      await fetchAndActivate(remoteConfig);

      // Get the value and emit
      const value = getValue(remoteConfig, 'show_task_stats');
      this.showTaskStatsSubject.next(value.asBoolean());
    } catch (error) {
      console.error('Failed to initialize Remote Config:', error);
      // Fallback to default value (false)
      this.showTaskStatsSubject.next(false);
    }
  }

  /**
   * Manually refresh remote config values from Firebase
   */
  async refresh(): Promise<void> {
    try {
      const remoteConfig = getRemoteConfig();
      await fetchAndActivate(remoteConfig);
      const value = getValue(remoteConfig, 'show_task_stats');
      this.showTaskStatsSubject.next(value.asBoolean());
    } catch (error) {
      console.error('Failed to refresh Remote Config:', error);
    }
  }
}
