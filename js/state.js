/* =========================================================
   ECOS DEL BOSQUE — estado y persistencia
   ========================================================= */
'use strict';

const SAVE_KEY = 'ecos-bosque-v1';

const STAT_KEYS = ['vida', 'energia', 'diversion'];

// puntos que se pierden por minuto de tiempo real
const DECAY = { vida: 0.55, energia: 1.05, diversion: 0.9 };
const STAT_MIN = 5;          // el amigo nunca llega a 0
const MAX_OFFLINE_MIN = 55;  // tope de desgaste si vuelves al día siguiente

const TASK_DEFS = [
  { id: 'alimentar', label: 'Alimentar' },
  { id: 'dormir',    label: 'Dormir' },
  { id: 'jugar',     label: 'Jugar' },
  { id: 'limpiar',   label: 'Limpiar' },
  { id: 'explorar',  label: 'Explorar' }
];
const TASK_REWARD = 6;

// suciedad: sube 1 punto cada 12 minutos de juego, máximo 6
const DIRT_MAX = 6;
const DIRT_EVERY_MIN = 12;

const todayKey = () => new Date().toISOString().slice(0, 10);

function blankTasks() {
  return TASK_DEFS.reduce((acc, t) => (acc[t.id] = 0, acc), {});
}

function freshState(name) {
  const now = Date.now();
  return {
    version: 1,
    name: name || 'Thor',
    coins: 0,
    stats: { vida: 80, energia: 75, diversion: 70 },
    tasks: blankTasks(),
    tasksClaimed: false,
    day: todayKey(),
    outfit: 'none',
    owned: ['none'],
    toyFound: false,
    explores: 0,
    dirt: 4,
    dirtFuel: 0,
    wins: 0,
    lastTick: now
  };
}

let S = null;
let saveTimer = null;

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data.stats) return null;
    return Object.assign(freshState(data.name), data);
  } catch (e) {
    return null;
  }
}

function save() {
  if (!S) return;
  S.lastTick = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
}

function saveSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 400);
}

/* ---------- stats ---------- */
function clampStat(v) { return Math.max(STAT_MIN, Math.min(100, v)); }

function applyDecay() {
  const now = Date.now();
  const minutes = Math.min((now - (S.lastTick || now)) / 60000, MAX_OFFLINE_MIN);
  S.lastTick = now;
  if (minutes <= 0) return 0;
  let changed = 0;
  STAT_KEYS.forEach(k => {
    const before = S.stats[k];
    S.stats[k] = clampStat(before - DECAY[k] * minutes);
    changed += before - S.stats[k];
  });
  growDirt(minutes);
  return changed;
}

/* ---------- suciedad ---------- */
function growDirt(minutes) {
  if (!minutes || minutes <= 0) return;
  if (S.dirt >= DIRT_MAX) { S.dirtFuel = 0; return; }
  S.dirtFuel = (S.dirtFuel || 0) + minutes;
  while (S.dirtFuel >= DIRT_EVERY_MIN && S.dirt < DIRT_MAX) {
    S.dirtFuel -= DIRT_EVERY_MIN;
    S.dirt++;
  }
  if (S.dirt >= DIRT_MAX) S.dirtFuel = 0;
}

function addStat(key, amount) {
  const before = S.stats[key];
  S.stats[key] = clampStat(S.stats[key] + amount);
  return S.stats[key] - before;
}

function addCoins(n, quiet) {
  S.coins = Math.max(0, S.coins + n);
  if (!quiet) {
    UI.coinBump(n);
    UI.toast((n > 0 ? '+' : '') + n + ' monedas');
  }
  saveSoon();
}

/* ---------- tareas del día ---------- */
function checkDay() {
  const t = todayKey();
  if (S.day !== t) {
    S.day = t;
    S.tasks = blankTasks();
    S.tasksClaimed = false;
  }
}

function completeTask(id) {
  checkDay();
  if (!(id in S.tasks)) return false;
  if (S.tasks[id] > 0) return false;
  S.tasks[id] = 1;
  saveSoon();
  return true;
}

function allTasksDone() {
  return TASK_DEFS.every(t => S.tasks[t.id] > 0);
}
