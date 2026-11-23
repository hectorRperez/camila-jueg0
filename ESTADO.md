# ESTADO — dónde se quedó el proyecto

Última actualización: 23 nov 2026

## Qué hay ahora mismo (jugable)

Abre `index.html` (doble clic). Portada del diseño (`Frame 1.svg`) → **INICIAR**.
La primera vez pide el nombre; si ya hay partida, entra directo.

- Navegación entre 6 escenas + el bosque exterior.
- 3 stats con desgaste por tiempo real y HUD del diseño (el icono se desliza en la barra).
- **Baño por minijuego**: el ciervo se ensucia con el tiempo y hay que tocar las ramas y
  la espuma para limpiarlo (6 manchas como máximo, una por punto de suciedad).
- Comer (pide una comida concreta), dormir (recupera energía en vivo), explorar.
- Minijuego de estrellas estilo Simón con recompensa de monedas.
- **Armario/tienda** en el bosque (tendedero flotante): 3 prendas de 10/15/20 monedas,
  se compran y se ponen, y el ciervo cambia de sprite.
- **Misión "El juguete perdido"**: explorando aparece la corona; el ciervo pasa a su
  forma de guardián del bosque.
- Tablero de tareas diarias y recompensa de 6 monedas.
- Guardado automático en localStorage; "Continuar" y confirmación para empezar de cero.
- Sonido generado con WebAudio (sin archivos), efectos de chispas, zzz, toasts.

Verificado con Chrome headless (`tools/cdp.mjs`): baño, comida, sueño, minijuego
(gana repitiendo la secuencia grabada), tareas y persistencia tras recargar.
Sin errores de consola.

## Último arreglo importante

`.overlay` (el fondo de los paneles emergentes) tenía `display:flex`, que anula el atributo
`hidden`; la capa quedaba invisible pero **capturaba todos los toques de la pantalla de
juego**. Se añadió `.overlay[hidden]{display:none}`. Desde entonces `tools/smoke.js`
comprueba con `elementFromPoint` que cada botón es alcanzable (0 bloqueados).

## Cómo probar rápido

```bash
node tools/cdp.mjs "file://$PWD/index.html#test" 390 844 /tmp/shot.png
```

`#test` entra directo al juego. Sin el hash, se prueba el título.

Prueba de toques (imprescindible tras tocar CSS de capas):

```bash
node tools/cdp.mjs "file://$PWD/index.html" 390 844 /tmp/smoke.png tools/smoke.js
```

## Lo siguiente, por orden sugerido

1. **Módulos hermanos**: cocina y dormir también tienen pantallas propias en `TAMAGOCHI/`
   (`PANTALLAS-02 3..8.svg`) sin programar todavía.
2. **Niveles de tarea** ("3 niveles por semana"): hoy cada tarea es 1 vez/día.
3. **Más expresiones**: hoy solo hay `idle`, `sad`, `sleep`. Con ropa puesta la cara triste
   se pierde (ver deudas).
4. **Pulido**: sonidos propios, transiciones entre escenas, PWA para instalarlo en el móvil.
5. **Balance**: revisar tiempos de desgaste y precios con alguien jugando de verdad.

## Decisiones tomadas (no rehacer)

- HTML/CSS/JS puro, **sin módulos ES** (para que funcione con `file://`).
- Escenario lógico 704×1524 escalado con transform.
- Arte del HUD reconstruido en CSS + iconos recortados (el PNG original no era dinámico).
- Estado global `S` en `js/state.js`; UI en `js/ui.js`; escenas en `js/game.js`.
- Sin backend: todo local.

## Deudas conocidas

- Si el ciervo va vestido y algún stat baja de 20, se mantiene la ropa (para no "perderla")
  y solo se aplica un filtro de desaturación: falta un sprite triste con ropa.
- El icono de la corona en el armario es el ciervo entero con corona (no hay corona suelta).

- El `dim` de dormir tapa también el HUD (queda oscuro el panel superior). Se ve bien,
  pero si molesta: subir `#hud`/`#coins` a `z-index:5` y `dim` a `2`.
- `#test` borra la partida guardada (es un atajo de desarrollo, no de producción).
- El fondo de la portada salió del SVG del diseñador con una marca de agua ya borrada;
  si se reemplaza el arte, revisar que no vuelva a aparecer.
- No hay versión horizontal: se muestra "gira tu teléfono".
- Assets originales sin tocar en `TAMAGOCHI/` y `TAMAGOCHI 2/` (59 MB) — se pueden borrar
  cuando el arte ya esté consolidado en `assets/`.
