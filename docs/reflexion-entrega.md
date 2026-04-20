# Respuestas breves (entrega de prueba tecnica)

Tres reflexiones alineadas con el enunciado. El detalle de medicion de rendimiento (LCP, INP, heap, escenarios S1/S2/S3) esta en [`informe-rendimiento.md`](informe-rendimiento.md).

---

## 1. Principales desafios al implementar las nuevas funcionalidades

**Pipeline iOS sin estacion de trabajo macOS.** La compilacion y firma iOS supone Xcode en macOS; sin Mac local no se valido el flujo completo en dispositivo fisico ni el archive local. La mitigacion adoptada fue: mantener `cordova-ios` en el proyecto, desarrollar y probar la logica compartida en **Android** y en **navegador**, y dejar documentado el camino hacia IPA mediante **CI con runner macOS** ([`codemagic.yaml`](../codemagic.yaml), workflow `ios-ipa`), descrito paso a paso en el README.

**Distribucion IPA (Apple Developer Program).** Para obtener un `.ipa` firmado de forma habitual (perfil de distribucion, integracion con App Store Connect) Apple exige **Apple Developer Program** (cuenta de pago) y credenciales configuradas en el proveedor de CI. En esta entrega **no se adjunta enlace publico a un IPA**: el bloqueo es de **acceso a firma y cuentas**, no de estructura del pipeline. El repositorio incluye workflow `ios-ipa` en Codemagic (`npm ci`, Ionic/Cordova, plataforma iOS, `pod install`, `xcode-project use-profiles`, `cordova build ios --release --device` con `build-ios-signing.json`, artefacto `platforms/ios/build/device/*.ipa`). Referencia: [Codemagic — Ionic Cordova](https://docs.codemagic.io/yaml-quick-start/building-a-cordova-app/).

**Coherencia entre categorias, tareas y Remote Config.** Con el flag `enable_categories` en falso hay que mantener **rutas coherentes** (guard), **datos locales** que siguen existiendo y una **UX** sin pantallas rotas ni rutas huerfanas. El trabajo fue centralizar el estado del flag en un servicio y enlazarlo a enrutamiento y formularios **sin repetir** la misma condicion en muchos componentes.

**Rendimiento con mucho volumen.** Al subir el numero de tareas, el cuello de botella deja de ser solo la carga inicial y pasa a **interactividad** (filtros, toggles, scroll) y **memoria / DOM**. El desafio fue definir un **protocolo reproducible** (DevTools, `seedPerfScenario` en desarrollo) y priorizar optimizaciones con impacto medible frente a un uso del cliente razonablemente acotado.

---

## 2. Tecnicas de optimizacion de rendimiento aplicadas y por que

Enfoque en **menos deteccion de cambios innecesaria**, **menos nodos visibles a la vez** y **menos pasadas sobre colecciones grandes**:

- **`ChangeDetectionStrategy.OnPush`** en las vistas mas sensibles al listado, para limitar reevaluaciones de plantilla cuando no cambian entradas relevantes.

- **`ion-infinite-scroll`** con pagina de tamano fijo, para no montar todo el dataset en el DOM de una sola vez (mejor percepcion de carga y menos presion inicial sobre memoria).

- **Proyeccion de estado en una sola pasada** (filtrado, conteos y lista derivada en un flujo coherente), frente a recalcular fragmentos en varios puntos del arbol de componentes.

- **Mapa `id -> categoria`** para resolver etiquetas en vista sin buscar en un array por cada fila.

- **Un solo `sort`** al ordenar o persistir tareas, evitando cadenas redundantes de filtro + orden.

Estas decisiones responden a los tres ejes del enunciado (carga, listas grandes, memoria). Las cifras y capturas estan en [`informe-rendimiento.md`](informe-rendimiento.md).

---

## 3. Como se aseguro la calidad y la mantenibilidad del codigo

- **Arquitectura por features:** servicios de dominio (`TaskService`, `CategoryService`), modelos tipados, guard de rutas ligado al feature flag y paginas Ionic en modulos por capacidad. Reduce acoplamiento y facilita ubicar cambios.

- **Herramientas estandar del repo:** ESLint y comandos documentados (`npm run lint`, `npm test`) como comprobacion basica antes de entregar.

- **Reproducibilidad:** variables en `environment*.ts` para Firebase/Remote Config, README con Cordova, Firebase y protocolo de laboratorio de rendimiento.

- **Degradacion controlada:** si Firebase no esta disponible o la configuracion es incompleta, el servicio de flags puede usar **valores por defecto** sin tumbar la aplicacion, lo que simplifica revision local y entornos parciales.

La mantenibilidad se apoya en **nombres y responsabilidades claras** (UI frente a persistencia frente a flags remotos) y en documentacion que conecta **codigo**, **criterios de prueba** y **entregables** del enunciado.
