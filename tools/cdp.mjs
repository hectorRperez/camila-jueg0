/* Driver mínimo de Chrome DevTools Protocol para probar el juego.
   Uso: node tools/cdp.mjs <url> <ancho> <alto> <salida.png> [script.js]
   El script opcional se evalúa en la página antes de la captura. */
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const [, , url, w = '390', h = '844', out = '/tmp/shot.png', scriptFile] = process.argv;

const port = 9333 + Math.floor(Math.random() * 400);
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio',
  '--allow-file-access-from-files', '--no-first-run', '--no-default-browser-check',
  ...(process.env.CDP_PROFILE ? ['--user-data-dir=' + process.env.CDP_PROFILE] : []),
  `--remote-debugging-port=${port}`,
  `--window-size=${w},${h}`,
  'about:blank'
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function endpoint() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) return (await r.json()).webSocketDebuggerUrl;
    } catch {}
    await sleep(150);
  }
  throw new Error('chrome no respondió');
}

const wsUrl = await endpoint();
const ws = new WebSocket(wsUrl);
await new Promise(res => ws.addEventListener('open', res));

let id = 0;
const pending = new Map();
const logs = [];
ws.addEventListener('message', ev => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  } else if (msg.method === 'Runtime.consoleAPICalled') {
    logs.push('[console] ' + msg.params.args.map(a => a.value ?? a.description ?? a.type).join(' '));
  } else if (msg.method === 'Runtime.exceptionThrown') {
    logs.push('[ERROR] ' + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text));
  } else if (msg.method === 'Log.entryAdded') {
    logs.push('[log:' + msg.params.entry.level + '] ' + msg.params.entry.text + ' ' + (msg.params.entry.url || ''));
  }
});

const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const mid = ++id;
  pending.set(mid, { resolve, reject });
  ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
});

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const s = (m, p) => send(m, p, sessionId);

await s('Runtime.enable');
await s('Log.enable');
await s('Page.enable');
await s('Emulation.setDeviceMetricsOverride', {
  width: +w, height: +h, deviceScaleFactor: 2, mobile: true
});
await s('Page.navigate', { url });
await sleep(1800);

if (scriptFile) {
  const code = fs.readFileSync(scriptFile, 'utf8');
  const res = await s('Runtime.evaluate', { expression: code, awaitPromise: true, returnByValue: true });
  if (res.exceptionDetails) logs.push('[eval-error] ' + res.exceptionDetails.text);
  else if (res.result?.value !== undefined) logs.push('[eval] ' + JSON.stringify(res.result.value));
  await sleep(1200);
}

if (process.env.CDP_RELOAD) {
  await s('Page.reload', { ignoreCache: true });
  await sleep(2000);
}

if (process.env.CDP_SCRIPT2) {
  const code2 = fs.readFileSync(process.env.CDP_SCRIPT2, 'utf8');
  const r2 = await s('Runtime.evaluate', { expression: code2, awaitPromise: true, returnByValue: true });
  if (r2.exceptionDetails) logs.push('[eval2-error] ' + r2.exceptionDetails.text);
  else if (r2.result?.value !== undefined) logs.push('[eval2] ' + JSON.stringify(r2.result.value));
  await sleep(1200);
}

const shot = await s('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));

console.log(logs.join('\n') || '(sin logs)');
ws.close();
chrome.kill();
process.exit(0);
