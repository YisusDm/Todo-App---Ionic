import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RemoteConfigService } from '../services/remote-config.service';

/**
 * Blocks `/categories` when Remote Config disables categories (fallback: false).
 * Ensures Remote Config finished loading before deciding.
 */
export const categoriesFeatureGuard: CanActivateFn = async () => {
  const remoteConfig = inject(RemoteConfigService);
  const router = inject(Router);
  await remoteConfig.ensureInitialized();
  return remoteConfig.areCategoriesEnabled() ? true : router.parseUrl('/tasks');
};
