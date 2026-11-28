# ECOS DEL BOSQUE — plan del juego

Juego web de cuidar a un ciervo del bosque, **móvil vertical**, en HTML + CSS + JS puro
(sin frameworks, sin build, sin dependencias).

## Cómo se abre

Doble clic en `index.html`. Funciona desde `file://` (no usa módulos ES a propósito).

Para probar rápido sin escribir el nombre: `index.html#test` (entra directo, borra la partida).

## Arquitectura

```
index.html          estructura de pantallas (título + juego)
css/style.css       todo el estilo, escenario lógico de 704 x 1524 px escalado
js/state.js         estado, guardado en localStorage, desgaste de stats, tareas diarias
js/ui.js            burbuja de diálogo, barras, overlays, sonido (WebAudio), efectos
js/game.js          escenas, acciones, minijuego, flujo del juego
assets/             arte optimizado (5.9 MB)
tools/              utilidades de desarrollo (Swift + Node), NO forman parte del juego
```

- **Escenario lógico fijo 704×1524**; `UI.fit()` aplica `transform: scale()` al contenedor
  según la ventana. Todo se posiciona en px lógicos y escala solo.
- **Sin frameworks**: scripts clásicos con un objeto global `S` (estado) y `UI`.
- **Guardado**: `localStorage['ecos-bosque-v1']`, autoguardado con debounce de 400 ms.
- **Stats**: `vida`, `energia`, `diversion` (0–100, mínimo 5). Desgaste por tiempo real,
  tope de 55 minutos de desgaste si vuelves al día siguiente.
- **Tareas diarias**: Alimentar, Dormir, Jugar, Limpiar, Explorar. Se reinician al cambiar
  de día (`YYYY-MM-DD`). Completar las 5 = 6 monedas (una vez al día).

## Flujo de entrada (portada)

La portada replica `TAMAGOCHI/Frame 1.svg`: bosque nocturno con cabaña, logo, **INICIAR**
y el texto de presentación. El fondo salió del propio SVG (imagen embebida) y se limpió
la marca de agua "PIXEL FAIRY" con `tools/fill.swift`.

| Situación | Qué pasa al pulsar INICIAR |
|-----------|----------------------------|
| No hay partida | Se abre el panel "¿Cómo se llama tu amigo?" → escribe el nombre → Jugar |
| Ya hay partida | Entra directo, sin preguntar nada. Aparece "Empezar de nuevo" abajo |

"Empezar de nuevo" es el único camino destructivo y pide confirmación.

## Modo escritorio

El juego detecta solo el dispositivo: si la ventana es apaisada y tiene al menos 900 px de
ancho entra en **modo escritorio**; si no, se queda en el móvil vertical. Al redimensionar
la ventana cambia en caliente (escenario, fondo y tamaños), sin recargar.

| | Móvil | Escritorio |
|---|---|---|
| Escenario lógico | 704 × 1524 (vertical) | 1600 × 900 (16:9) |
| Fondos | `assets/bg/*.jpg` (verticales) | `assets/bg/desk/*.jpg` (apaisados) |
| HUD | 268 px de ancho | 350 px, tipografía mayor |
| Mascota | 436 px de alto | 430 px, centrada sobre la alfombra/cama |
| Bocadillo | abajo a la izquierda, 418 px | abajo a la izquierda, 500 px |
| Acciones | fila sobre la barra | menú vertical a la derecha |
| Navegación | 6 botones de 108 px | 6 botones de 136 px |

El escalado sigue siendo uniforme (`min(ancho, alto)`), así que en pantallas que no son
16:9 aparecen unas franjas oscuras arriba/abajo, igual que en móvil.

### Fondo de cada pantalla

| Pantalla | Móvil | Escritorio (carpeta `fondos 2`) |
|---|---|---|
| Portada | `bg/title.jpg` | `pantallas 2-05` |
| Casa | `bg/home.jpg` | `pantallas 2-03` |
| Baño | `bg/bath.jpg` | `pantallas 2_Mesa de trabajo 1` |
| Cocina | `bg/kitchen.jpg` | `pantallas 2-02` |
| Dormir | `bg/bedroom.jpg` | `pantallas 2-06` |
| Juego / Tareas / Bosque | `bg/forest.jpg` | `pantallas 2-04` |

Los originales son 8000 × 4500; se optimizaron a 1600 × 900 JPEG q78 (1,7 MB los seis).

## Escenas y mapa de acciones

| Escena    | Fondo          | Acción                     | Efecto                                  |
|-----------|----------------|----------------------------|-----------------------------------------|
| casa      | `bg/home.jpg`  | Salir al bosque            | va a `exterior`                         |
| bano      | `bg/bath.jpg`  | Limpiar las manchas        | minijuego de suciedad (ver abajo); si está limpio, "Bañarme" da un premio pequeño |
| cocina    | `bg/kitchen.jpg`| Comer                     | pide una comida; acertar +20 vida, +1 moneda |
| dormir    | `bg/bedroom.jpg`| Dormir                    | sube energía en tiempo real, tarea Dormir|
| juego     | `bg/forest.jpg`| Iniciar (minijuego)        | recoger las 11 estrellas, +5 monedas    |
| tarea     | `bg/forest.jpg`| Ver tareas                 | tablero + recompensa                    |
| exterior  | `bg/forest.jpg`| Explorar / Armario / Volver| monedas al azar, tarea Explorar, misión de la corona |

## Minijuego de las estrellas (Frame 12-23)

Se juega **sobre la escena**, sin ventanas emergentes, como en el diseño.

1. Entras a JUEGO: el HUD se ve, el ciervo aparece más grande y flota un botón **INICIAR**.
2. Al pulsarlo **se ocultan los stats y las monedas** y aparecen **11 estrellas azules**
   repartidas por el bosque (`STAR_SPOTS`, posiciones medidas de los frames).
3. Solo **una brilla a la vez** (halo pulsante). Se toca esa y desaparece; entonces brilla
   la siguiente. Tocar otra no resta nada: tiembla y avisa.
4. Al recoger las 11: **+5 monedas, +25 diversión**, tarea "Jugar" y el mensaje
   "¡Lo lograste!". Vuelven el HUD y el botón INICIAR.

El sprite de la estrella es `assets/ui/snowflake.png` (el `9.png` del diseñador).

## Módulo del baño

Basado en `TAMAGOCHI/PANTALLAS-02 1-1.svg`.

- El ciervo acumula **suciedad**: `S.dirt` de 0 a 6, sube 1 punto cada 12 minutos
  (`DIRT_EVERY_MIN`) y se guarda en la partida.
- Al entrar al baño con `dirt > 0`, el sprite pasa a llorando (`pet/sad.png`) y aparecen
  las manchas encima, una por punto de suciedad.
- Cada mancha es un `<img>` posicionado en % sobre el sprite (`DIRT_SPOTS`), con brillo
  pulsante para invitar a tocarla. Al tocarla: chapoteo, sonido, +2 vida y desaparece.
- Al limpiar la última: +6 vida, +14 diversión, +2 monedas, tarea "Limpiar" y el mensaje
  "¡Excelente! Ya puedes volver a casa.".
- Piezas de arte en `assets/bath/`: `foam`, `branch1`, `branch2`, `branch3`, `moss`
  (extraídas del SVG del diseñador y optimizadas).

## Mapa de arte

- `assets/pet/`: `idle`, `sad`, `sleep`, `sleep_pillow`, y los disfraces `vest`, `scarf`,
  `hat`, `crown` (aún sin usar en el juego).
- `assets/ui/`: `n-*.png` botones de nav en dorado, `a-*.png` versión azul activa,
  `knob-*.png` iconos del HUD (corazón, rayo, estrella) con fondo recortado,
  `logo.png`, `btn-start.png`, `star.png`, `snowflake.png`, `check.png`, `cl-*.png` ropa.
- `assets/item/`: `berry`, `herb`, `acorn`, `stick` (comida del bosque).
- Fuentes: **Pixelify Sans** (texto) y **Silkscreen** (etiquetas), auto-hospedadas en `assets/fonts`.

## Herramientas de desarrollo

- `tools/sheet.swift` — hoja de contactos de imágenes/PDFs (para revisar arte sin abrir 1 a 1).
- `tools/opt.swift` — escala nearest-neighbor (pixel art nítido).
- `tools/crop.swift`, `tools/key.swift` — recorte y borrado de fondo de iconos.
- `tools/patch.swift`, `tools/fill.swift` — clonar zonas y rellenar interpolando (limpieza de arte).
- `tools/smoke.js` — prueba de humo que verifica que **cada control es alcanzable por un
  toque** (`elementFromPoint`), no solo que el listener exista. Lanzar siempre después de
  tocar CSS de capas:
  `node tools/cdp.mjs "file://$PWD/index.html" 390 844 out.png tools/smoke.js`
- `tools/cdp.mjs` — driver de Chrome headless para probar de verdad:
  `node tools/cdp.mjs "file://$PWD/index.html#test" 390 844 out.png script.js`
  (el script se evalúa en la página; `CDP_RELOAD=1` recarga antes de capturar).

## Fases

- [x] **Fase 0 — Arte**: inventario, recorte del HUD, optimización 59 MB → 5.9 MB.
- [x] **Fase 1 — Esqueleto**: título, escenas, HUD, navegación, diálogos, guardado.
- [x] **Fase 2 — El ciervo**: stats con desgaste, cuidado (baño, comida, sueño), estados de ánimo.
- [x] **Fase 3 — Minijuego de las estrellas** (versión del diseñador, ver abajo) + monedas.
- [x] **Fase 4a — Tareas diarias** y recompensa.
- [x] **Fase 4b — Armario/ropa**: 3 prendas (`vest`, `sweater`, `winter`) + corona secreta.
      Se compran y se ponen desde el mismo panel; el tendedero flota en el bosque.
- [x] **Fase 4c — Tienda**: precios 10 / 15 / 20 monedas, integrada en el armario.
- [x] **Fase 4d — Misión "El juguete perdido"**: explorando el bosque aparece (35 % por
      búsqueda, garantizada a la 6ª). Desbloquea la corona y la deja equipada.
- [ ] **Fase 5 — Pulido**: más expresiones, sonidos propios, transiciones, guardado
      multi-perfil, PWA instalable, balance de tiempos.

## Armario (detalle)

| id        | Nombre           | Precio | Sprite                | Icono                    |
|-----------|------------------|--------|-----------------------|--------------------------|
| `none`    | Sin ropa         | —      | `pet/idle.png`        | `pet/idle.png`           |
| `vest`    | Chaleco          | 10     | `pet/vest.png`        | `ui/cl-vest.png`         |
| `sweater` | Suéter           | 15     | `pet/scarf.png`       | `ui/cl-sweater.png`      |
| `winter`  | Gorro y bufanda  | 20     | `pet/hat.png`         | `ui/cl-hatscarf.png`     |
| `crown`   | Corona del bosque| misión | `pet/crown.png`       | `pet/crown.png` (secreta)|

El estado guarda `owned: []` (compras) y `outfit: 'none'`.

## Ideas pendientes (del diseño original)

- "3 niveles por semana" por tarea (mencionado en la pantalla de inicio).
- Flechas laterales para caminar entre habitaciones en vez de salto directo.
