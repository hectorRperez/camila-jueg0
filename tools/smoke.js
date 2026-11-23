/* Prueba de humo con TOPE REAL: comprueba que cada control es alcanzable
   por un toque (elementFromPoint), no solo que el listener exista.
   Uso: node tools/cdp.mjs "file://$PWD/index.html" 390 844 out.png tools/smoke.js */
(async () => {
  const w = ms => new Promise(r => setTimeout(r, ms));
  const blocked = [];
  const report = [];

  const center = el => {
    const r = el.getBoundingClientRect();
    return [r.x + r.width / 2, r.y + r.height / 2];
  };
  const hit = el => {
    const [x, y] = center(el);
    const t = document.elementFromPoint(x, y);
    return !!t && (t === el || el.contains(t));
  };
  const tap = el => {
    if (!hit(el)) { blocked.push(describe(el)); return false; }
    const [x, y] = center(el);
    document.elementFromPoint(x, y).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return true;
  };
  const describe = el => {
    const id = el.id ? '#' + el.id : '';
    const cls = (el.className || '').toString().split(' ')[0];
    const txt = (el.textContent || '').trim().slice(0, 22);
    return (el.tagName.toLowerCase() + id + (cls ? '.' + cls : '') + (txt ? ' "' + txt + '"' : ''));
  };
  const check = (label, els) => {
    const arr = !els ? [] : (els instanceof Element ? [els] : [...els]);
    const bad = arr.filter(e => !hit(e));
    bad.forEach(e => blocked.push(label + ' → ' + describe(e)));
    report.push(`${label}: ${arr.length - bad.length}/${arr.length}`);
  };

  // --- portada
  tap(document.getElementById('btnStart'));
  await w(300);
  check('portada · modal nombre', [document.getElementById('nameInput'), document.getElementById('btnNameOk')]);
  document.getElementById('nameInput').value = 'Camila';
  tap(document.getElementById('btnNameOk'));
  await w(1200);

  // --- navegación
  const navs = [...document.querySelectorAll('.nav-btn')];
  check('nav · botones', navs);

  // --- acción de casa
  const salir = [...document.querySelectorAll('#actionBar .act')].find(b => /bosque/i.test(b.textContent));
  check('casa · acción salir', salir);
  if (tap(salir)) await w(900);

  // --- tendedero del bosque
  const floats = [...document.querySelectorAll('#forestDecor .float-item')];
  check('bosque · ropa flotante', floats);
  if (tap(floats[0])) await w(700);

  // --- armario
  const cards = [...document.querySelectorAll('.shop-card')];
  check('armario · tarjetas', cards);
  check('armario · cerrar', [document.getElementById('shopClose')]);
  tap(document.getElementById('shopClose'));
  await w(400);

  // --- cocina
  tap(navs.find(b => b.dataset.scene === 'cocina'));
  await w(800);
  const comer = [...document.querySelectorAll('#actionBar .act')].find(b => /comer/i.test(b.textContent));
  check('cocina · acción comer', comer);
  if (tap(comer)) await w(600);
  check('cocina · comidas', document.querySelectorAll('.food'));
  document.querySelector('#overlay').dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await w(400);

  // --- juego
  tap(navs.find(b => b.dataset.scene === 'juego'));
  await w(800);
  const jugar = [...document.querySelectorAll('#actionBar .act')].find(b => /jugar/i.test(b.textContent));
  check('juego · acción jugar', jugar);
  if (tap(jugar)) await w(600);
  check('juego · estrellas', document.querySelectorAll('.star-pad'));
  await w(400);
  const salirSimon = document.getElementById('simonQuit');
  check('juego · salir', salirSimon);
  if (salirSimon) tap(salirSimon);
  await w(400);

  // --- dormir
  tap(navs.find(b => b.dataset.scene === 'dormir'));
  await w(800);
  const dormir = [...document.querySelectorAll('#actionBar .act')].find(b => /dormir/i.test(b.textContent));
  check('dormir · acción dormir', dormir);
  S.stats.energia = 30;
  if (tap(dormir)) await w(900);
  const despertar = [...document.querySelectorAll('#actionBar .act')].find(b => /despertar/i.test(b.textContent));
  check('dormir · despertar', despertar);
  if (despertar) tap(despertar);
  await w(400);

  // --- tareas
  S.dirt = 0;
  tap(navs.find(b => b.dataset.scene === 'tarea'));
  await w(900);
  check('tareas · cerrar', [document.getElementById('taskClose')]);

  return { report, bloqueados: blocked };
})()
