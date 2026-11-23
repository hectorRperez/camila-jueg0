/* =========================================================
   ECOS DEL BOSQUE — juego
   ========================================================= */
'use strict';

const SCENES = {
  casa: {
    bg: 'assets/bg/home.jpg',
    nav: 'house',
    bubble: '¡Hola, {name}! Me alegra verte. ¿Qué hacemos hoy?',
    actions: [{ label: 'Salir al bosque', run: () => enterScene('exterior') }]
  },
  bano: {
    bg: 'assets/bg/bath.jpg',
    nav: 'bath',
    bubble: '¡Estoy limpio y fresquito! ¿Quieres bañarme otra vez?',
    actions: [{ label: 'Bañarme', run: doBath }]
  },
  cocina: {
    bg: 'assets/bg/kitchen.jpg',
    nav: 'food',
    bubble: 'Tengo mucha hambre. Elige la comida que te pido para llenar mi barriga.',
    actions: [{ label: 'Comer', run: openFood }]
  },
  dormir: {
    bg: 'assets/bg/bedroom.jpg',
    nav: 'sleep',
    pet: { bottom: 476, height: 392 },
    bubble: 'Mi energía se está agotando. Prestame la cama para descansar.',
    actions: [{ label: 'Dormir', run: doSleep }]
  },
  juego: {
    bg: 'assets/bg/forest.jpg',
    nav: 'play',
    bubble: 'Pulsa Jugar y repite el orden de las estrellas para ganar una recompensa.',
    actions: [{ label: 'Jugar', run: openSimon }]
  },
  tarea: {
    bg: 'assets/bg/forest.jpg',
    nav: 'task',
    bubble: 'Estas son mis tareas de hoy. ¡Complétalas todas y gana monedas!',
    actions: [{ label: 'Ver tareas', run: openTasks }]
  },
  exterior: {
    bg: 'assets/bg/forest.jpg',
    nav: 'house',
    bubble: '¡Qué bonito el bosque, {name}! Toca la ropa que flota para vestirme, o explora entre las ramas.',
    actions: [
      { label: 'Explorar', run: doExplore },
      { label: 'Armario', run: openWardrobe },
      { label: 'Volver a casa', run: () => enterScene('casa') }
    ]
  }
};

/* ---------- armario ---------- */
const OUTFITS = {
  none:    { name: 'Sin ropa',         price: 0,  icon: 'assets/pet/idle.png',      sprite: 'assets/pet/idle.png' },
  vest:    { name: 'Chaleco',          price: 10, icon: 'assets/ui/cl-vest.png',     sprite: 'assets/pet/vest.png' },
  sweater: { name: 'Suéter',           price: 15, icon: 'assets/ui/cl-sweater.png',  sprite: 'assets/pet/scarf.png' },
  winter:  { name: 'Gorro y bufanda',  price: 20, icon: 'assets/ui/cl-hatscarf.png', sprite: 'assets/pet/hat.png' },
  crown:   { name: 'Corona del bosque', price: 0, icon: 'assets/pet/crown.png',      sprite: 'assets/pet/crown.png', secret: true }
};
const OUTFIT_ORDER = ['none', 'vest', 'sweater', 'winter', 'crown'];

const NAV_ICONS = {
  house: ['n-house', 'a-house'],
  bath:  ['n-bath',  'a-bath'],
  food:  ['n-food',  'a-food'],
  sleep: ['n-sleep', 'a-sleep'],
  play:  ['n-play',  'a-play'],
  task:  ['n-task',  'a-task']
};

/* ---------- baño: manchas de suciedad ----------
   x, y y w son porcentajes del recuadro del sprite del ciervo.
   El orden importa: con dirt=3 se muestran las 3 primeras. */
const DIRT_SPOTS = [
  { src: 'assets/bath/foam.png',    x: 27, y: 13, w: 22, rot: -6 },  // espuma en la cornamenta izquierda
  { src: 'assets/bath/branch2.png', x: 86, y: 40, w: 27, rot: 4 },   // rama grande a la derecha
  { src: 'assets/bath/foam.png',    x: 35, y: 85, w: 17, rot: 8 },   // espuma en la patita
  { src: 'assets/bath/branch1.png', x: 9,  y: 63, w: 24, rot: 0 },   // ramita en el hombro
  { src: 'assets/bath/moss.png',    x: 76, y: 64, w: 19, rot: -4 },  // rama con musgo
  { src: 'assets/bath/foam.png',    x: 71, y: 21, w: 19, rot: 10 }   // espuma en la cornamenta derecha
];

const FOODS = [
  { id: 'berry',  name: 'Fruta',   src: 'assets/item/berry.png',  hint: 'la fruta roja del bosque' },
  { id: 'herb',   name: 'Hierba',  src: 'assets/item/herb.png',   hint: 'la hierba verde' },
  { id: 'acorn',  name: 'Bellota', src: 'assets/item/acorn.png',  hint: 'la bellota marrón' }
];

let currentScene = 'casa';
let busy = false;

/* ================= arranque ================= */
function boot() {
  UI.init();

  const saved = loadState();
  const nameInput = $('#nameInput');

  // si ya hay partida, la portada saluda con su nombre y ofrece empezar de cero
  if (saved) {
    if (saved.name) {
      $('#introName').textContent = saved.name;
      nameInput.value = saved.name;
    }
    $('#btnNewGame').hidden = false;
  }

  // Iniciar: si hay partida continúa sin preguntar nada; si no, pide el nombre
  $('#btnStart').addEventListener('click', () => {
    const prev = loadState();
    if (prev) {
      startGame(prev.name, prev);
    } else {
      UI.beep(660, 0.08, 'square', 0.05);
      openNameModal();
    }
  });

  function openNameModal() {
    $('#nameModal').hidden = false;
    setTimeout(() => nameInput.focus(), 120);
  }

  function playWithName() {
    const n = String(nameInput.value || '').trim().slice(0, 12);
    $('#nameModal').hidden = true;
    startGame(n || 'THOR', null, true);
  }

  $('#btnNameOk').addEventListener('click', playWithName);
  nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') playWithName();
  });

  $('#btnNewGame').addEventListener('click', () => {
    $('#confirmNew').hidden = false;
    UI.beep(520, 0.08, 'square', 0.05);
  });
  $('#yesNew').addEventListener('click', () => {
    $('#confirmNew').hidden = true;
    openNameModal();
  });
  $('#noNew').addEventListener('click', () => {
    $('#confirmNew').hidden = true;
    UI.beep(320, 0.1, 'sine', 0.04);
  });

  $$('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => enterScene(btn.dataset.scene));
  });

  $$('#forestDecor .float-item').forEach(btn => {
    btn.addEventListener('click', () => { UI.beep(600, 0.07, 'square', 0.05); openWardrobe(); });
  });

  ['casa','bano','cocina','dormir','juego','tarea','exterior'].forEach(k => preload(SCENES[k].bg));
  ['idle','sad','sleep','sleep_pillow','vest','scarf','hat','crown'].forEach(p => preload('assets/pet/' + p + '.png'));
  OUTFIT_ORDER.forEach(id => preload(OUTFITS[id].icon));
  FOODS.forEach(f => preload(f.src));
  preload('assets/ui/snowflake.png');
  preload('assets/ui/star.png');

  setInterval(tick, 4000);
  addEventListener('visibilitychange', () => {
    if (document.hidden) save();
    else { applyDecay(); UI.renderStats(); updateMood(); }
  });
  addEventListener('pagehide', save);

  // atajo de desarrollo: index.html#test entra directo al juego
  if (location.hash === '#test') {
    startGame(nameInput.value || 'Camila', null, true);
  }
}

function preload(src) {
  const i = new Image();
  i.src = src;
  return i;
}

function startGame(name, existing, isNew) {
  const clean = String(name || '').trim().slice(0, 12);
  if (existing) {
    S = existing;
  } else if (isNew) {
    S = freshState(clean || 'Thor');
  } else {
    S = loadState() || freshState(clean || 'Thor');
    if (clean) S.name = clean;
  }
  if (!S.name) S.name = 'Thor';
  checkDay();
  applyDecay();
  UI.renderStats();
  save();

  UI.beep(660, 0.1, 'square', 0.05);
  $('#screen-title').classList.remove('active');
  $('#screen-game').classList.add('active');
  setTimeout(() => enterScene('casa'), 220);
}

/* ================= bucle ================= */
function tick() {
  if (!S || !$('#screen-game').classList.contains('active')) return;
  checkDay();
  const lost = applyDecay();
  if (lost > 0.4) {
    UI.renderStats();
    updateMood();
    saveSoon();
  }
}

function updateMood() {
  if (currentScene === 'dormir' && sleeping) return;
  const low = STAT_KEYS.some(k => S.stats[k] < 20) || (S.dirt || 0) >= 5;
  const fit = S.outfit && S.outfit !== 'none' ? OUTFITS[S.outfit] : null;
  const src = fit ? fit.sprite : (low ? 'assets/pet/sad.png' : 'assets/pet/idle.png');
  UI.setPet(src, low ? 'sad' : '');
}

/* ================= escenas ================= */
function enterScene(id) {
  if (!SCENES[id]) return;
  const sc = SCENES[id];
  currentScene = id;

  // si estábamos durmiendo, cortamos la siesta al cambiar de sala
  if (sleeping) {
    clearInterval(sleepTimer);
    sleeping = false;
    stopDim();
    updateMood();
  }

  UI.setBg(sc.bg);
  UI.el.bubble.classList.remove('show');
  const dirtLayer = $('#dirtLayer');
  if (dirtLayer) dirtLayer.innerHTML = '';

  // navegación activa
  $$('.nav-btn').forEach(btn => {
    const active = btn.dataset.scene === id;
    btn.classList.toggle('active', active);
    const [normal, blue] = NAV_ICONS[SCENES[btn.dataset.scene].nav];
    btn.firstElementChild.src = 'assets/ui/' + (active ? blue : normal) + '.png';
  });

  // mascota
  const pp = sc.pet || {};
  UI.el.petWrap.style.setProperty('--pet-bottom', (pp.bottom || 368) + 'px');
  UI.el.petWrap.style.setProperty('--pet-height', (pp.height || 436) + 'px');
  sleeping = false;
  updateMood();
  stopDim();

  renderActions(sc.actions);
  UI.bubble(sc.bubble.replace('{name}', S.name));

  $('#forestDecor').hidden = id !== 'exterior';

  // el baño tiene su propia mecánica: limpiar las manchas una a una
  if (id === 'bano' && S.dirt > 0) startBathGame();

  if (id === 'exterior') {
    if (completeTask('explorar')) UI.toast('Tarea: Explorar ✓');
  }
  if (id === 'tarea') setTimeout(() => { if (currentScene === 'tarea') openTasks(); }, 550);

  saveSoon();
}

function renderActions(list) {
  const bar = $('#actionBar');
  bar.innerHTML = '';
  list.forEach(a => {
    const b = document.createElement('button');
    b.className = 'act';
    b.textContent = a.label;
    b.addEventListener('click', () => { UI.beep(700, 0.06, 'square', 0.05); a.run(); });
    bar.appendChild(b);
  });
}

function setActions(list) { renderActions(list); }

/* ================= acciones ================= */
function doBath() {
  if (busy) return;
  busy = true;
  updateMood();
  UI.sparkles(16);
  UI.beep(880, 0.1, 'triangle', 0.06);
  setTimeout(() => UI.beep(1100, 0.1, 'triangle', 0.06), 130);
  setTimeout(() => UI.beep(1320, 0.14, 'triangle', 0.06), 260);

  // baño rápido cuando ya está limpio: premio pequeño
  const v = addStat('vida', 4);
  const d = addStat('diversion', 6);
  addStat('energia', -2);

  UI.bubble('¡Qué rico! Ya me siento limpio y despejado.');
  setTimeout(() => {
    UI.renderStats();
    busy = false;
    if (v > 0 || d > 0) UI.toast('¡Limpio! +6 diversión');
  }, 900);

  if (completeTask('limpiar')) UI.toast('Tarea: Limpiar ✓', 2200);
  saveSoon();
}

function openFood() {
  const want = FOODS[Math.floor(Math.random() * FOODS.length)];
  const options = FOODS.slice().sort(() => Math.random() - 0.5);

  UI.openOverlay(`
    <div class="op-title">¿Qué quiero comer?</div>
    <p class="op-text">Hoy me apetece <b>${want.hint}</b>.</p>
    <div class="food-row">
      ${options.map(f => `
        <button class="food" data-food="${f.id}">
          <img src="${f.src}" alt="${f.name}">
          <span>${f.name}</span>
        </button>`).join('')}
    </div>
  `, panel => {
    $$('.food', panel).forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.food;
        if (id === want.id) {
          btn.classList.add('good');
          UI.chime();
          addStat('vida', 20);
          addStat('diversion', 6);
          UI.renderStats();
          UI.sparkles(8, 'assets/ui/star.png');
          if (completeTask('alimentar')) UI.toast('Tarea: Alimentar ✓');
          UI.bubble('¡Ñam! Es justo lo que quería. ¡Gracias, ' + S.name + '!');
          setTimeout(() => { UI.closeOverlay(); updateMood(); }, 700);
          addCoins(1);
        } else {
          btn.classList.add('bad');
          setTimeout(() => btn.classList.remove('bad'), 420);
          UI.sadTone();
          UI.bubble('Mmm, eso no es lo que pedí...');
        }
      });
    });
  });
}

let sleeping = false;
let sleepTimer = null;

function doSleep() {
  if (sleeping) return;
  if (S.stats.energia > 95) {
    UI.bubble('¡Todavía no tengo sueño! Mi energía está al máximo.');
    UI.beep(300, 0.12, 'sine', 0.04);
    return;
  }

  sleeping = true;
  const wasLow = S.stats.energia < 40;
  UI.setPet('assets/pet/sleep.png', 'sleeping');
  startDim();
  UI.zzz();
  UI.beep(392, 0.2, 'sine', 0.05);
  UI.bubbleStatic('Zzz... estoy recuperando energía.');
  setActions([{ label: 'Despertar', run: () => endSleep(true) }]);

  sleepTimer = setInterval(() => {
    addStat('energia', 2.2);
    UI.renderStats();
    UI.bubbleStatic('Zzz... energía al ' + Math.round(S.stats.energia) + '%.');
    if (S.stats.energia >= 99.5) endSleep(false);
  }, 400);

  if (completeTask('dormir')) UI.toast('Tarea: Dormir ✓', 2400);
  if (wasLow) setTimeout(() => { if (sleeping) UI.zzz(); }, 2400);
  saveSoon();
}

function endSleep(manual) {
  if (!sleeping) return;
  sleeping = false;
  clearInterval(sleepTimer);
  stopDim();
  UI.chime();
  UI.bubble(manual ? '¡Ya estoy despierto! Gracias por la siesta.' : '¡Listo! Recargué toda mi energía.');
  renderActions(SCENES[currentScene].actions);
  updateMood();
  save();
}

/* ---------- armario y tienda ---------- */
function ownsOutfit(id) {
  return id === 'none' || (S.owned || []).includes(id);
}

function openWardrobe() {
  UI.openOverlay(`
    <div class="op-title">Armario del bosque</div>
    <p class="op-text">Compra ropa con tus monedas y pónsela a <b>${S.name}</b>.</p>
    <div class="shop-grid" id="shopGrid"></div>
    <div class="shop-coins">
      <img src="assets/ui/star.png" alt="">
      <span id="shopCoins">${S.coins}</span>
    </div>
    <button class="link-btn" id="shopClose">Cerrar</button>
  `, panel => {
    const grid = $('#shopGrid', panel);

    function paint() {
      const ids = OUTFIT_ORDER.filter(id => !OUTFITS[id].secret || ownsOutfit(id));
      grid.innerHTML = ids.map(id => {
        const it = OUTFITS[id];
        const owned = ownsOutfit(id);
        const worn = S.outfit === id;
        const tag = worn ? 'Puesto' : owned ? 'Poner' : '★ ' + it.price;
        return `
          <button class="shop-card ${worn ? 'worn' : ''} ${owned ? '' : 'locked'}" data-id="${id}">
            <div class="shop-img"><img src="${it.icon}" alt=""></div>
            <span class="shop-name">${it.name}</span>
            <span class="shop-tag">${tag}</span>
          </button>`;
      }).join('');

      $$('.shop-card', grid).forEach(card => {
        card.addEventListener('click', () => pick(card.dataset.id));
      });
      $('#shopCoins', panel).textContent = S.coins;
    }

    function pick(id) {
      if (S.outfit === id) return;
      const it = OUTFITS[id];

      if (!ownsOutfit(id)) {
        if (S.coins < it.price) {
          UI.sadTone();
          UI.toast('Te faltan ' + (it.price - S.coins) + ' monedas', 2000);
          return;
        }
        S.coins -= it.price;
        S.owned = (S.owned || ['none']).concat(id);
        UI.chime();
        UI.sparkles(12, 'assets/ui/star.png');
        UI.coinBump(-it.price);
        UI.toast('¡Compraste ' + it.name + '!');
      } else {
        UI.beep(760, 0.07, 'square', 0.05);
      }

      S.outfit = id;
      updateMood();
      save();
      paint();
      UI.bubble(id === 'none' ? 'Me quité la ropa, estoy más cómodo.' : '¡Me encanta mi ' + it.name.toLowerCase() + '!');
    }

    $('#shopClose', panel).addEventListener('click', () => UI.closeOverlay());
    paint();
  });
}

/* ---------- baño ---------- */
function startBathGame() {
  const layer = $('#dirtLayer');
  layer.innerHTML = '';
  const n = Math.min(DIRT_SPOTS.length, Math.max(0, S.dirt));

  if (n === 0) return false;

  UI.setPet('assets/pet/sad.png', 'sad');
  DIRT_SPOTS.slice(0, n).forEach((spot, i) => {
    const img = document.createElement('img');
    img.src = spot.src;
    img.className = 'dirt';
    img.alt = '';
    img.style.left = spot.x + '%';
    img.style.top = spot.y + '%';
    img.style.width = spot.w + '%';
    img.style.setProperty('--rot', (spot.rot || 0) + 'deg');
    img.style.animationDelay = (i * 0.12) + 's, ' + (0.5 + i * 0.2) + 's';
    img.addEventListener('click', e => {
      e.stopPropagation();
      cleanSpot(img, spot);
    });
    layer.appendChild(img);
  });

  setActions([]);
  UI.bubble('Necesito un baño. ¡Toca las ramas y el sucio para que desaparezcan!', { speed: 18 });
  UI.beep(320, 0.14, 'sine', 0.05);
  return true;
}

function cleanSpot(img, spot) {
  if (img.dataset.clean) return;
  img.dataset.clean = '1';
  img.classList.add('pop');
  setTimeout(() => img.remove(), 340);

  UI.splash(spot.x, spot.y, 6);
  UI.beep(760 + Math.random() * 260, 0.07, 'triangle', 0.05);
  addStat('vida', 2);
  UI.renderStats();

  S.dirt = Math.max(0, S.dirt - 1);
  const left = document.querySelectorAll('#dirtLayer .dirt:not(.pop)').length;
  if (left > 0) {
    UI.bubbleStatic(left === 1 ? '¡Casi! Queda una mancha.' : `¡Bien! Quedan ${left} manchas.`);
  } else {
    finishBath();
  }
  saveSoon();
}

function finishBath() {
  S.dirt = 0;
  S.dirtFuel = 0;
  addStat('vida', 6);
  const div = addStat('diversion', 14);
  updateMood();
  UI.splash(50, 60, 14);
  UI.sparkles(16);
  UI.chime();
  UI.renderStats();
  UI.bubble('¡Excelente! Ya puedes volver a casa.');
  setActions([
    { label: 'Bañarme otra vez', run: () => doBath() },
    { label: 'Volver a casa', run: () => enterScene('casa') }
  ]);
  if (completeTask('limpiar')) UI.toast('Tarea: Limpiar ✓', 2400);
  addCoins(2);
  if (div > 0) UI.sparkles(6, 'assets/ui/star.png');
  save();
}

/* ---------- explorar ---------- */
function doExplore() {
  UI.beep(520, 0.08, 'triangle', 0.05);
  UI.bubble('Estoy buscando entre las ramas...');
  UI.sparkles(6, 'assets/ui/snowflake.png');

  setTimeout(() => {
    S.explores = (S.explores || 0) + 1;

    // misión: el juguete perdido
    if (!S.toyFound && (S.explores >= 6 || Math.random() < 0.35)) {
      findToy();
      return;
    }

    const found = Math.random() < 0.5;
    if (found) {
      addCoins(2);
      UI.chime();
      UI.sparkles(10, 'assets/ui/star.png');
      UI.bubble('¡Encontré monedas escondidas en el bosque!');
      addStat('diversion', 8);
    } else {
      UI.beep(300, 0.1, 'sine', 0.04);
      UI.bubble(S.toyFound
        ? 'Hoy no encontré nada... ¡pero qué bonito paseo!'
        : 'Hoy no encontré nada... Seguro que hay algo escondido por aquí.');
      addStat('diversion', 4);
    }
    UI.renderStats();
    saveSoon();
  }, 1100);
}

function findToy() {
  S.toyFound = true;
  S.owned = (S.owned || ['none']).concat('crown');
  S.outfit = 'crown';
  updateMood();
  save();
  UI.chime();
  UI.sparkles(20, 'assets/ui/star.png');

  UI.openOverlay(`
    <div class="op-title">El juguete perdido</div>
    <p class="op-text">Entre las raíces encontré un juguete viejo... ¡y una corona que brilla!</p>
    <div class="reward-row"><img src="assets/pet/crown.png" alt="Corona"></div>
    <p class="op-text">Ahora <b>${S.name}</b> es el guardián del bosque.</p>
    <button class="big-btn op-close" id="wearCrown">¡Ponérmela!</button>
  `, panel => {
    $('#wearCrown', panel).addEventListener('click', () => {
      UI.closeOverlay();
      UI.chime();
      UI.sparkles(14, 'assets/ui/star.png');
      UI.bubble('¡Soy el guardián del bosque! Gracias por ayudarme, ' + S.name + '.');
      UI.toast('¡Corona desbloqueada!', 2400);
    });
  });
}

/* ---------- minijuego de estrellas ---------- */
const SIMON_TONES = [523, 659, 880];

function openSimon() {
  let seq = [], step = 0, showing = false, locked = true, alive = true, timer = null;

  UI.openOverlay(`
    <div class="op-title">El juego de las estrellas</div>
    <p class="op-text" id="simonMsg">Mira con atención el orden...</p>
    <div class="stars-row">
      <button class="star-pad" data-i="0"><img src="assets/ui/star.png" alt=""></button>
      <button class="star-pad" data-i="1"><img src="assets/ui/star.png" alt=""></button>
      <button class="star-pad" data-i="2"><img src="assets/ui/star.png" alt=""></button>
    </div>
    <div class="simon-status" id="simonStatus">Prepárate</div>
    <button class="act op-close" id="simonQuit">Salir</button>
  `, panel => {
    const pads = $$('.star-pad', panel);
    const status = $('#simonStatus', panel);
    const msg = $('#simonMsg', panel);

    $('#simonQuit', panel).addEventListener('click', () => {
      alive = false;
      clearTimeout(timer);
      UI.closeOverlay();
      setTimeout(() => UI.bubble('¡Volvamos cuando quieras!'), 250);
    });

    pads.forEach(p => p.addEventListener('click', () => {
      if (!alive || locked || showing) return;
      const i = +p.dataset.i;
      flashPad(pads[i]);
      UI.beep(SIMON_TONES[i], 0.12, 'triangle', 0.06);
      if (i === seq[step]) {
        step++;
        status.textContent = step + ' / ' + seq.length;
        if (step >= seq.length) win();
      } else {
        fail();
      }
    }));

    function flashPad(p) {
      p.classList.add('lit');
      setTimeout(() => p.classList.remove('lit'), 260);
    }

    function play() {
      showing = true;
      locked = true;
      status.textContent = 'Observa...';
      seq.forEach((i, k) => {
        setTimeout(() => {
          if (!alive) return;
          flashPad(pads[i]);
          UI.beep(SIMON_TONES[i], 0.16, 'triangle', 0.06);
        }, 480 + k * 560);
      });
      timer = setTimeout(() => {
        if (!alive) return;
        showing = false;
        locked = false;
        step = 0;
        status.textContent = '0 / ' + seq.length;
        msg.textContent = 'Ahora repite el orden tocando las estrellas.';
      }, 480 + seq.length * 560 + 200);
    }

    function newRound() {
      if (!alive) return;
      seq = Array.from({ length: 4 }, () => Math.floor(Math.random() * 3));
      step = 0;
      msg.textContent = 'Mira con atención el orden...';
      play();
    }

    function win() {
      locked = true;
      status.textContent = '¡Correcto!';
      UI.chime();
      addStat('diversion', 25);
      addStat('vida', 4);
      S.wins = (S.wins || 0) + 1;
      if (completeTask('jugar')) UI.toast('Tarea: Jugar ✓');
      UI.sparkles(12, 'assets/ui/star.png');
      UI.renderStats();
      addCoins(5);
      msg.textContent = '¡Lo lograste! Ganaste 5 monedas.';
      UI.bubble('¡Increíble! Ese juego me puso muy contento.');
      save();
      timer = setTimeout(() => {
        if (!alive) return;
        locked = false;
        step = 0;
        newRound();
      }, 2600);
    }

    function fail() {
      locked = true;
      status.textContent = 'Casi...';
      UI.sadTone();
      msg.textContent = 'Te equivocaste, pero puedes intentarlo otra vez.';
      timer = setTimeout(() => {
        if (!alive) return;
        locked = false;
        step = 0;
        newRound();
      }, 1500);
    }

    newRound();
  });
}

/* ---------- tareas ---------- */
function openTasks() {
  const done = allTasksDone();
  const claimed = S.tasksClaimed;

  const rows = TASK_DEFS.map(t => `
    <div class="task ${S.tasks[t.id] ? 'done' : ''}">
      <div class="box"><img src="assets/ui/check.png" alt=""></div>
      <span>${t.label}</span>
    </div>`).join('');

  UI.openOverlay(`
    <div class="op-title">Tareas de hoy</div>
    <div class="task-list">${rows}</div>
    <p class="op-text">${done
      ? (claimed ? '¡Ya recogiste la recompensa de hoy!' : '¡Completaste todo! Reclama tus ' + TASK_REWARD + ' monedas.')
      : 'Completa las ' + TASK_DEFS.length + ' tareas para ganar ' + TASK_REWARD + ' monedas.'}</p>
    ${done && !claimed ? '<button class="big-btn op-close" id="claimBtn">Reclamar ' + TASK_REWARD + ' monedas</button>' : ''}
    <button class="link-btn op-close" id="taskClose" style="color:#6b4423;text-shadow:none;font-size:24px">Cerrar</button>
  `, panel => {
    $('#taskClose', panel).addEventListener('click', () => UI.closeOverlay());
    const claim = $('#claimBtn', panel);
    if (claim) claim.addEventListener('click', () => {
      S.tasksClaimed = true;
      addCoins(TASK_REWARD);
      UI.chime();
      UI.sparkles(14, 'assets/ui/star.png');
      UI.closeOverlay();
      setTimeout(() => UI.bubble('¡Gracias! Mañana habrá tareas nuevas.'), 260);
      save();
    });
  });
}

/* ---------- oscurecer para dormir ---------- */
function startDim() {
  let d = $('.dim');
  if (!d) {
    d = document.createElement('div');
    d.className = 'dim';
    $('#screen-game').appendChild(d);
  }
  requestAnimationFrame(() => d.classList.add('on'));
}
function stopDim() {
  const d = $('.dim');
  if (d) d.classList.remove('on');
}

document.addEventListener('DOMContentLoaded', boot);
