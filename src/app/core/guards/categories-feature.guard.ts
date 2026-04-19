import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { FeatureFlagsService } from '../services/feature-flags.service';

export const categoriesFeatureGuard: CanMatchFn = () => {
  const featureFlags = inject(FeatureFlagsService);
  if (featureFlags.categoriesEnabled) {
    return true;
  }
  return inject(Router).createUrlTree(['/']);
};
