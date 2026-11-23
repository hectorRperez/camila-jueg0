/* =========================================================
   ECOS DEL BOSQUE — interfaz, sonido y efectos
   ========================================================= */
'use strict';

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const UI = {
  el: {},
  typing: null,

  init() {
    this.el.stage = $('#stage');
    this.el.bg = $('#bg');
    this.el.pet = $('#pet');
    this.el.petWrap = $('#petWrap');
    this.el.petFx = $('#petFx');
    this.el.bubble = $('#bubble');
    this.el.bubbleText = $('#bubbleText');
    this.el.overlay = $('#overlay');
    this.el.overlayPanel = $('#overlayPanel');
    this.el.toast = $('#toast');
    this.el.coins = $('#coins');
    this.fn = {};

    this.fit();
    addEventListener('resize', () => this.fit());
    addEventListener('orientationchange', () => setTimeout(() => this.fit(), 120));

    this.el.overlay.addEventListener('click', e => {
      if (e.target === this.el.overlay) this.closeOverlay();
    });

    // desbloquea audio con el primer toque
    const unlock = () => { this.audio(); removeEventListener('pointerdown', unlock); };
    addEventListener('pointerdown', unlock);
  },

  fit() {
    const s = Math.min(innerWidth / 704, innerHeight / 1524);
    this.el.stage.style.transform = `scale(${s})`;
  },

  /* ---------- stats ---------- */
  renderStats() {
    STAT_KEYS.forEach(k => {
      const box = $(`.stat[data-stat="${k}"]`);
      if (!box) return;
      const v = Math.max(0, Math.min(100, S.stats[k]));
      const fill = box.querySelector('.fill');
      const knob = box.querySelector('.knob');
      fill.style.setProperty('--fill', v + '%');
      const kp = Math.max(6, Math.min(94, v));
      knob.style.setProperty('--knob', kp + '%');
    });
    $('#coinCount').textContent = S.coins;
  },

  coinBump(n) {
    const c = this.el.coins;
    c.classList.remove('bump');
    void c.offsetWidth;
    c.classList.add('bump');
    $('#coinCount').textContent = S.coins;
  },

  /* ---------- burbuja ---------- */
  bubble(text, opts = {}) {
    clearInterval(this.typing);
    const box = this.el.bubble;
    const target = text;
    box.classList.add('show');
    if (opts.instant) { this.el.bubbleText.textContent = target; return; }

    let i = 0;
    this.el.bubbleText.textContent = '';
    const speed = opts.speed || 26;
    this.typing = setInterval(() => {
      i++;
      this.el.bubbleText.textContent = target.slice(0, i);
      if (i >= target.length) clearInterval(this.typing);
    }, speed);
  },

  bubbleStatic(text) {
    clearInterval(this.typing);
    this.el.bubble.classList.add('show');
    this.el.bubbleText.textContent = text;
  },

  hideBubble() {
    clearInterval(this.typing);
    this.el.bubble.classList.remove('show');
  },

  /* ---------- mascota ---------- */
  setPet(src, cls) {
    const pet = this.el.pet;
    if (pet.getAttribute('src') !== src) {
      pet.classList.remove('enter');
      pet.setAttribute('src', src);
      void pet.offsetWidth;
      pet.classList.add('enter');
    }
    pet.classList.toggle('sleeping', cls === 'sleeping');
    pet.classList.toggle('sad', cls === 'sad');
  },

  /* ---------- fondo ---------- */
  setBg(src) {
    const bg = this.el.bg;
    if (bg.getAttribute('src') === src) return;
    bg.classList.add('out');
    setTimeout(() => {
      bg.setAttribute('src', src);
      bg.classList.remove('out');
    }, 180);
  },

  /* ---------- efectos ---------- */
  sparkles(count = 14, icon = 'assets/ui/snowflake.png') {
    const wrap = this.el.petFx;
    for (let i = 0; i < count; i++) {
      const img = document.createElement('img');
      img.src = icon;
      img.className = 'spark';
      img.style.left = (20 + Math.random() * 60) + '%';
      img.style.top = (15 + Math.random() * 70) + '%';
      img.style.setProperty('--dx', (Math.random() * 130 - 65) + 'px');
      img.style.setProperty('--dy', (-40 - Math.random() * 140) + 'px');
      img.style.animationDelay = (Math.random() * 0.5) + 's';
      img.style.width = img.style.height = (22 + Math.random() * 26) + 'px';
      wrap.appendChild(img);
      setTimeout(() => img.remove(), 1900);
    }
  },

  splash(xPct, yPct, n = 6) {
    const wrap = this.el.petFx;
    for (let i = 0; i < n; i++) {
      const d = document.createElement('div');
      d.className = 'drop';
      d.style.left = xPct + '%';
      d.style.top = yPct + '%';
      d.style.setProperty('--dx', (Math.random() * 140 - 70) + 'px');
      d.style.setProperty('--dy', (-30 - Math.random() * 100) + 'px');
      d.style.animationDelay = (Math.random() * 0.12) + 's';
      wrap.appendChild(d);
      setTimeout(() => d.remove(), 950);
    }
  },

  zzz() {
    const wrap = this.el.petFx;
    for (let i = 0; i < 3; i++) {
      const z = document.createElement('div');
      z.className = 'zzz';
      z.textContent = 'z';
      z.style.left = (62 + i * 6) + '%';
      z.style.top = (26 - i * 4) + '%';
      z.style.animationDelay = (i * 0.8) + 's';
      wrap.appendChild(z);
      setTimeout(() => z.remove(), 5200);
    }
  },

  /* ---------- toast ---------- */
  toast(msg, ms = 1700) {
    const t = this.el.toast;
    t.textContent = msg;
    t.hidden = false;
    t.classList.add('show');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.hidden = true, 220);
    }, ms);
  },

  /* ---------- overlay ---------- */
  openOverlay(html, onMount) {
    const o = this.el.overlay;
    this.el.overlayPanel.innerHTML = html;
    o.hidden = false;
    void o.offsetWidth;
    o.classList.add('open');
    if (onMount) onMount(this.el.overlayPanel);
  },

  closeOverlay() {
    const o = this.el.overlay;
    o.classList.remove('open');
    setTimeout(() => { o.hidden = true; this.el.overlayPanel.innerHTML = ''; }, 220);
    if (this.onClose) { const f = this.onClose; this.onClose = null; f(); }
  },

  /* ---------- sonido ---------- */
  audio() {
    if (!this._ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this._ac = new AC();
    }
    if (this._ac.state === 'suspended') this._ac.resume();
    return this._ac;
  },

  beep(freq = 520, dur = 0.08, type = 'square', vol = 0.06) {
    const ac = this.audio();
    if (!ac) return;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.connect(g).connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + dur);
  },

  chime() {
    [523, 659, 784].forEach((f, i) => setTimeout(() => this.beep(f, 0.14, 'triangle', 0.07), i * 90));
  },

  sadTone() {
    this.beep(210, 0.16, 'sawtooth', 0.05);
    setTimeout(() => this.beep(160, 0.22, 'sawtooth', 0.05), 120);
  }
};
