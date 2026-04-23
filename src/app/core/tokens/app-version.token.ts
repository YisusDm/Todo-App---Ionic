import { InjectionToken } from '@angular/core';
import packageJson from '../../../../package.json';

export const APP_VERSION = new InjectionToken<string>('AppVersion', {
  providedIn: 'root',
  factory: () => packageJson.version,
});
