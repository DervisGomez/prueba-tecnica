# Respuestas breves (entrega de prueba tecnica)

Documento corto con las tres reflexiones pedidas en el enunciado. El detalle de medicion de rendimiento sigue en [`respuestas-entrega.md`](respuestas-entrega.md).

---

## 1. Principales desafios al implementar las nuevas funcionalidades

**Entorno iOS sin Mac.** Apple exige macOS y Xcode para firmar y generar un `.ipa`. Sin Mac no pude validar el build iOS de punta a punta en hardware real ni automatizar el archive localmente. La salida practica fue dejar la plataforma `cordova-ios` declarada y documentada en el README, desarrollar y probar en Android y en navegador, y planear la exportacion del IPA mediante una Mac ajena, un servicio CI con runner macOS (por ejemplo CodeMagic o Ionic Appflow) o un prestamo temporal de equipo Apple. Eso suma tiempo de coordinacion y a veces coste, pero no bloquea el desarrollo de la logica ni la paridad de codigo entre plataformas.

**Coherencia entre categorias, tareas y feature flag.** Hubo que definir bien que ocurre cuando Remote Config desactiva categorias: rutas protegidas con guard, datos existentes en almacenamiento local y una UX que no deje al usuario en callejones sin salida. Requirio acoplar el servicio de flags con el enrutamiento y con los formularios sin duplicar condiciones en muchos sitios.

**Rendimiento con muchas tareas.** Al crecer el volumen, el cuello dejo de ser solo "cargar datos" y paso a ser interactividad (filtros, toggles, scroll) y memoria. Fue un desafio medir con criterio (DevTools, escenarios reproducibles) y decidir hasta donde compensaba optimizar en el cliente frente a asumir limites razonables de uso.

---

## 2. Tecnicas de optimizacion de rendimiento aplicadas y por que

Se aplicaron cambios centrados en **menos trabajo por ciclo de deteccion de cambios**, **menos nodos en pantalla a la vez** y **menos pasadas sobre colecciones grandes**:

- **`ChangeDetectionStrategy.OnPush`** en vistas pesadas, para que Angular no reevaluie plantillas salvo cuando cambian entradas referenciales o se dispara deteccion explicita. Reduce costo CPU cuando la lista o el estado cambian con frecuencia moderada.

- **Lista incremental con `ion-infinite-scroll`** y tamano de pagina acotado, para no montar miles de filas DOM de golpe. Mejora carga percibida y memoria frente a renderizar todo el dataset.

- **Proyeccion del estado en una sola pasada** sobre las tareas (filtrado, conteos y lista visible derivada en un mismo flujo), en lugar de recalcular fragmentos sueltos en varios sitios. Menos recorridos repetidos sobre arrays grandes.

- **Mapa `id -> categoria`** para resolver etiquetas en la vista sin buscar en un array por cada fila renderizada.

- **Un unico `sort`** al ordenar tareas al persistir o reordenar, en lugar de encadenar filtros y ordenaciones redundantes.

El **por que** de cada punto esta alineado con los tres ejes del enunciado: carga inicial mas controlada, interaccion mas estable con muchas tareas y menor presion sobre heap y listeners. Las mediciones concretas (LCP, INP, heap snapshots en escenarios S1/S2/S3) estan documentadas en `respuestas-entrega.md`.

---

## 3. Como se aseguro la calidad y la mantenibilidad del codigo

- **Estructura por capas y features:** servicios de dominio (`TaskService`, `CategoryService`), modelos tipados, guard de rutas para el flag y paginas Ionic en modulos de feature. Facilita localizar cambios y evitar logica duplicada en componentes.

- **Herramientas del proyecto:** uso de **ESLint** y comandos documentados (`npm run lint`, `npm test`) como red de seguridad basica ante regresiones de estilo y errores evidentes.

- **Configuracion y despliegue claros:** variables de entorno para Firebase y Remote Config, README con pasos de Cordova, Firebase y laboratorio de rendimiento, para que otra persona pueda reproducir el entorno sin adivinar.

- **Comportamiento degradable:** si Firebase no esta disponible o la configuracion esta incompleta, el servicio de flags puede caer a valores por defecto sin tumbar la app entera, lo que mejora robustez en desarrollo y revisiones.

La mantenibilidad se apoya en nombres consistentes, responsabilidades separadas (UI vs persistencia vs flags remotos) y documentacion que enlaza codigo con criterios de prueba y entrega.
