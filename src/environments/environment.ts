// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebase: {
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
    minimumFetchIntervalMillis: 60_000,
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
