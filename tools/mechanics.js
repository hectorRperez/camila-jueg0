/* Prueba de mecánicas del juego actual.
   Uso: node tools/cdp.mjs "file://$PWD/index.html#test" 390 844 out.png tools/mechanics.js */
(async () => {
  const w = ms => new Promise(r => setTimeout(r, ms));
  const log = [];

  // --- baño: limpiar todas las manchas
  S.dirt = 4; S.tasks.limpiar = 0;
  enterScene('bano'); await w(700);
  const manchas = document.querySelectorAll('.dirt').length;
  for (const m of [...document.querySelectorAll('.dirt')]) { m.click(); await w(160); }
  await w(700);
  log.push(['baño', { manchas, dirt: S.dirt, tarea: S.tasks.limpiar, pet: document.getElementById('pet').getAttribute('src') }]);

  // --- cocina: acertar la comida pedida
  enterScene('cocina'); await w(500);
  const v0 = S.stats.vida;
  [...document.querySelectorAll('#actionBar .act')].find(b => /comer/i.test(b.textContent)).click();
  await w(500);
  const pista = document.querySelector('.op-text b').textContent;
  const mapa = { 'la fruta roja del bosque': 'berry', 'la hierba verde': 'herb', 'la bellota marrón': 'acorn' };
  document.querySelector(`.food[data-food="${mapa[pista]}"]`).click();
  await w(800);
  log.push(['cocina', { pista, vida: +(S.stats.vida - v0).toFixed(1), tarea: S.tasks.alimentar }]);
  document.getElementById('overlay').dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await w(400);

  // --- juego: tocar solo la estrella encendida hasta terminarlo
  enterScene('juego'); await w(600);
  S.stats.diversion = 40;
  const d0 = S.stats.diversion;
  document.getElementById('miniStart').click();
  await w(600);
  let vueltas = 0;
  while (document.querySelector('.star.lit') && vueltas < 30) {
    document.querySelector('.star.lit').click();
    await w(140);
    vueltas++;
  }
  await w(900);
  log.push(['juego', { estrellasRestantes: document.querySelectorAll('.star').length, toques: vueltas, diversion: +(S.stats.diversion - d0).toFixed(1), tarea: S.tasks.jugar, coins: S.coins }]);

  // --- dormir
  enterScene('dormir'); await w(500);
  S.stats.energia = 20;
  const e0 = S.stats.energia;
  [...document.querySelectorAll('#actionBar .act')].find(b => /dormir/i.test(b.textContent)).click();
  await w(1500);
  const despertar = [...document.querySelectorAll('#actionBar .act')].find(b => /despertar/i.test(b.textContent));
  const e1 = S.stats.energia;
  if (despertar) despertar.click();
  await w(300);
  log.push(['dormir', { subio: +(e1 - e0).toFixed(1), tarea: S.tasks.dormir }]);

  // --- tareas: reclamar
  S.tasks = { alimentar: 1, dormir: 1, jugar: 1, limpiar: 1, explorar: 1 };
  S.tasksClaimed = false;
  const c0 = S.coins;
  enterScene('tarea'); await w(900);
  const claim = document.getElementById('claimBtn');
  if (claim) claim.click();
  await w(400);
  log.push(['tareas', { habiaBoton: !!claim, coins: S.coins - c0, claimed: S.tasksClaimed }]);

  // --- guardado
  save();
  const raw = localStorage.getItem('ecos-bosque-v1');
  log.push(['guardado', { ok: !!JSON.parse(raw).name, bytes: raw.length }]);

  return log;
})()
