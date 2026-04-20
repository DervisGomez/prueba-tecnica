export const environment = {
  production: true,
  firebase: {
    /** Debe ser true en release para que Remote Config alimente los feature flags en APK/IPA (mismo proyecto que en `environment.ts`). */
    enabled: true,
    config: {
      apiKey: "AIzaSyDVH7P1A9WWncV-4qZD6mLVW5MLg7HexCA",
      authDomain: "prueba-tecnica-pragma.firebaseapp.com",
      projectId: "prueba-tecnica-pragma",
      storageBucket: "prueba-tecnica-pragma.firebasestorage.app",
      messagingSenderId: "557308732496",
      appId: "1:557308732496:web:5e2e1df88d92ea3cee1d55",
      measurementId: "G-5X5JM7KW84"
    },
  },
  remoteConfig: {
    /** Mismo intervalo que en dev: en produccion real subir (p. ej. 3600000) para no martillar el API. */
    minimumFetchIntervalMillis: 60_000,
  },
};
