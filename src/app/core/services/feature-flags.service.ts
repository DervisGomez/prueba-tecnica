import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import {
  fetchAndActivate,
  getBoolean,
  getRemoteConfig,
  RemoteConfig,
} from 'firebase/remote-config';
import { environment } from '../../../environments/environment';

const FLAG_ENABLE_CATEGORIES = 'enable_categories';

@Injectable({ providedIn: 'root' })
export class FeatureFlagsService {
  private readonly categoriesEnabled$ = new BehaviorSubject<boolean>(true);

  get categoriesEnabled(): boolean {
    return this.categoriesEnabled$.value;
  }

  watchCategoriesEnabled(): Observable<boolean> {
    return this.categoriesEnabled$.asObservable();
  }

  async init(): Promise<void> {
    const firebaseConfig = environment.firebase.config;
    // console.log('[RC] firebase.enabled:', environment.firebase.enabled);
    if (!environment.firebase.enabled || !isFirebaseConfigComplete(firebaseConfig)) {
      // console.warn(
      //   '[RC] Firebase deshabilitado o configuracion incompleta. Se omite Remote Config.'
      // );
      return;
    }

    try {
      const app = this.ensureFirebaseApp(firebaseConfig);
      const remoteConfig = getRemoteConfig(app);
      this.configureRemoteConfig(remoteConfig);
      // console.log(
      //   '[RC] minimumFetchIntervalMillis:',
      //   environment.remoteConfig.minimumFetchIntervalMillis
      // );
      const activated = await fetchAndActivate(remoteConfig);
      // console.log('[RC] fetchAndActivate activated:', activated);
      const flagValue = getBoolean(remoteConfig, FLAG_ENABLE_CATEGORIES);
      // console.log('[RC] enable_categories:', flagValue);
      this.categoriesEnabled$.next(flagValue);
    } catch (error) {
      // console.error('No se pudo cargar Remote Config. Se usan flags por defecto.', error);
    }
  }

  private ensureFirebaseApp(config: FirebaseOptions): FirebaseApp {
    if (getApps().length > 0) {
      return getApp();
    }
    return initializeApp(config);
  }

  private configureRemoteConfig(remoteConfig: RemoteConfig): void {
    remoteConfig.settings = {
      fetchTimeoutMillis: 10_000,
      minimumFetchIntervalMillis:
        environment.remoteConfig.minimumFetchIntervalMillis,
    };
    remoteConfig.defaultConfig = {
      [FLAG_ENABLE_CATEGORIES]: true,
    };
  }
}

function isFirebaseConfigComplete(config: FirebaseOptions): boolean {
  const requiredKeys: Array<keyof FirebaseOptions> = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];
  return requiredKeys.every((key) => {
    const value = config[key];
    return typeof value === 'string' && value.trim().length > 0;
  });
}
