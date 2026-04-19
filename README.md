# Prueba Tecnica Mobile - Ionic + Angular

Aplicacion To-Do desarrollada con Ionic y Angular, con soporte hibrido para Android/iOS via Cordova.

## Repositorio (versionamiento)

- **GitHub (repositorio publico):** [github.com/DervisGomez/prueba-tecnica](https://github.com/DervisGomez/prueba-tecnica)
- **Clonar el codigo:**

```bash
git clone https://github.com/DervisGomez/prueba-tecnica.git
cd prueba-tecnica
```

Segun las instrucciones de la prueba, conviene trabajar en una **rama** dedicada y entregar el enlace al remoto con el historial de **commits** claro (mensajes descriptivos, cambios acotados por commit).

## Alcance implementado

- CRUD de tareas: crear, editar, completar y eliminar.
- Persistencia local con `@ionic/storage-angular`.
- Modulo de categorias:
  - crear categoria,
  - editar categoria,
  - eliminar categoria,
  - asignar categoria a tareas,
  - filtrar tareas por categoria.
- UI movil con Ionic Components y enrutamiento modular.

## Stack tecnico

- Ionic Angular 8
- Angular 20
- Cordova (`cordova-android`, `cordova-ios`)
- Ionic Storage

## Requisitos previos

- Node.js 20+ (recomendado LTS)
- npm 10+
- Ionic CLI
- Java JDK (para Android)
- Android Studio (SDK + emulator)
- Xcode (solo macOS, para iOS)
- CocoaPods (iOS)

Instalar Ionic CLI:

```bash
npm install -g @ionic/cli
```

## Instalacion del proyecto

Desde la raiz del repositorio:

```bash
npm install
```

## Ejecucion en navegador

```bash
ionic serve
```

## Estructura hibrida Cordova

La aplicacion esta configurada con Cordova en:

- `config.xml`
- `package.json` (seccion `cordova`)

Plataformas declaradas: `android` e `ios`.

Si necesitas recrearlas:

```bash
ionic cordova platform rm android ios
ionic cordova platform add android
ionic cordova platform add ios
```

## Ejecutar en Android

Compilar y correr en dispositivo/emulador:

```bash
ionic cordova run android
```

Build release (APK/AAB segun configuracion):

```bash
ionic cordova build android --release
```

APK tipico de salida:

`platforms/android/app/build/outputs/apk/release/app-release.apk`

## Ejecutar en iOS (requiere macOS)

Compilar y abrir en Xcode:

```bash
ionic cordova build ios
open platforms/ios/*.xcworkspace
```

Desde Xcode:

1. Configurar Team de firma.
2. Seleccionar dispositivo destino.
3. Archive > Distribute App para exportar `.ipa`.

## Firebase + Remote Config (Feature Flag)

> Estado actual: integrado en codigo (requiere configurar credenciales Firebase y ejecutar instalacion de dependencias).

### Objetivo de la feature flag

Controlar una funcionalidad sin publicar nueva version (ejemplo: habilitar/deshabilitar categorias).

En esta app se usa el flag remoto `enable_categories` para mostrar/ocultar:

- boton de gestion de categorias,
- filtro por categorias,
- selector de categoria en formulario de tarea,
- acceso a la ruta `categorias`.

### Pasos sugeridos de implementacion

1. Crear proyecto en Firebase Console.
2. Agregar apps Android/iOS y descargar:
   - `google-services.json` (Android)
   - `GoogleService-Info.plist` (iOS)
3. Integrar Firebase en Ionic/Angular.
4. Completar `src/environments/environment.ts` y `src/environments/environment.prod.ts`:
   - `firebase.enabled = true`
   - `firebase.config` con datos reales del proyecto
5. Configurar Remote Config con parametro booleano:
   - `enable_categories = true|false`
6. Consumir flag al iniciar app y condicionar UI/rutas.
7. Documentar prueba funcional:
   - valor `true`: categoria visible y usable
   - valor `false`: categoria oculta o bloqueada

## Optimizacion de rendimiento

> Estado actual: optimizacion funcional aplicada y lista para evidenciar en pruebas.

### Mejoras aplicadas

- `ChangeDetectionStrategy.OnPush` en modulos de tareas/categorias.
- Carga incremental para listas grandes con `ion-infinite-scroll` y tamano de pagina fijo.
- Estado reactivo con `BehaviorSubject` y `Observable`.
- Proyeccion del ViewModel de tareas en una sola pasada:
  - filtrado,
  - conteo pendientes/completadas,
  - armado de lista visible.
- Eliminacion de busquedas repetidas por categoria en template (diccionario `id -> categoria`).
- Ordenamiento de tareas optimizado con una sola pasada de `sort` (antes se hacian filtros + sort por separado).

### Pendiente para cerrar evidencia de la prueba

- Medir y documentar tiempos de carga inicial y fluidez con volumen alto de datos.
- Registrar evidencia de memoria/render (capturas del profiler o video de comparativa).
- Justificar en el README el impacto de cada mejora con resultados observables.

### Protocolo de medicion y evidencia (para entrega)

#### 1) Escenarios de volumen

Probar al menos estos tres escenarios:

- S1: 100 tareas
- S2: 1,000 tareas
- S3: 5,000 tareas

Distribucion sugerida:

- 70% pendientes y 30% completadas.
- 20% sin categoria y 80% distribuidas entre 5-10 categorias.

Carga automatica disponible en entorno de desarrollo:

1. Ejecutar `ionic serve`.
2. Abrir la app en el navegador y luego DevTools Console.
3. Ejecutar uno de estos comandos:

```js
await window.seedPerfScenario('S1'); // 100 tareas
await window.seedPerfScenario('S2'); // 1,000 tareas
await window.seedPerfScenario('S3'); // 5,000 tareas
```

Tambien puedes usar un numero personalizado:

```js
await window.seedPerfScenario(2500); // 2,500 tareas
```

Para limpiar datos de prueba:

```js
await window.clearPerfScenario();
```

#### 2) Metricas minimas

- Carga inicial: tiempo desde apertura hasta pantalla interactiva.
- Lista grande: tiempo de respuesta en scroll, cambio de filtro y acciones de tarea.
- Memoria: heap inicial vs heap final tras interacciones repetidas.

#### 3) Herramienta y pasos (Chrome DevTools)

1. Levantar app en navegador con `ionic serve`.
2. Abrir DevTools (`F12`).
3. En `Performance`: grabar perfil al recargar y durante interacciones.
4. En `Memory`: tomar snapshot inicial y final.

Secuencia de interacciones por escenario (repetir 3 veces y promediar):

1. Cargar dataset del escenario.
2. Cerrar y abrir app.
3. Medir carga inicial.
4. Scroll continuo por 20-30 segundos.
5. Cambiar filtros 10 veces.
6. Completar/descompletar 30 tareas.
7. Editar 20 tareas.
8. Medir memoria final.

#### 4) Plantilla de resultados (copiar y completar)

Entorno de prueba:

- SO:
- CPU/RAM:
- Navegador y version:
- Node/Ionic:

Resultados (promedio de 3 corridas):

| Escenario | Carga inicial (ms) | Cambio de filtro (ms) | Toggle tarea (ms) | Fluidez scroll | Heap inicial (MB) | Heap final (MB) |
| --- | ---: | ---: | ---: | --- | ---: | ---: |
| S1 (100) |  |  |  |  |  |  |
| S2 (1,000) |  |  |  |  |  |  |
| S3 (5,000) |  |  |  |  |  |  |

Evidencia adjunta:

- Captura de `Performance` (carga inicial).
- Captura de `Performance` (scroll + filtros).
- Captura de `Memory` (heap inicial/final).
- Video corto (30-60s) mostrando uso con lista grande.

#### 5) Respuesta sugerida para la pregunta de optimizacion

Tecnicas aplicadas y motivo:

- `OnPush` para reducir renders innecesarios en componentes principales.
- Carga incremental (`ion-infinite-scroll`) para evitar render masivo inicial.
- Proyeccion del ViewModel en una sola pasada para reducir trabajo por actualizacion.
- Diccionario `id -> categoria` para evitar busquedas repetidas por item renderizado.
- Ordenado de tareas con una sola operacion de `sort` para menor costo de CPU/memoria.

## Pruebas y calidad

Comandos:

```bash
npm run lint
npm test
```

Recomendado agregar pruebas para:

- `TaskService` (alta/edicion/completado/eliminacion)
- `CategoryService` (CRUD + descategorizacion de tareas al borrar)
- filtro por categoria en vista de tareas

## Entregables esperados

- Codigo fuente actualizado en Git (rama de trabajo + PR/fork).
- README con pasos de compilacion y cambios.
- Evidencia visual (capturas o video).
- APK generado.
- IPA generado (si aplica por disponibilidad de Mac).
- Respuestas documentadas:
  - desafios principales,
  - optimizaciones aplicadas,
  - estrategia de calidad y mantenibilidad.

Informe detallado de rendimiento (para evaluadores):

- `docs/respuestas-entrega.md` (solo reporte de rendimiento)

## Checklist final de entrega

- [x] Repositorio publico actualizado con commits claros. Remoto: `https://github.com/DervisGomez/prueba-tecnica.git`
- [ ] README completo y validado por otra persona.
- [ ] Firebase y Remote Config funcionando.
- [ ] Feature flag demostrada con evidencia.
- [ ] Rendimiento optimizado y justificado.
- [ ] APK exportado y enlace de descarga disponible.
- [ ] IPA exportado y enlace de descarga disponible (o justificacion tecnica).
- [ ] Capturas/video de funcionalidades.
- [ ] Documento de respuestas finales redactado.

## Notas sobre IPA en Linux/Windows

En Linux/Windows puedes desarrollar y generar Android sin problema. Para exportar `.ipa` debes:

- usar una Mac fisica,
- usar CI/servicio cloud con entorno macOS (CodeMagic, Appflow, etc.),
- o pedir compilacion a alguien con Mac.
