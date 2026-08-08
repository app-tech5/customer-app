#!/usr/bin/env node
/**
 * Set Arabic + RTL via Hermes, navigate to Settings, screencap for market visuals.
 * Usage: node scripts/hermes-capture-arabic-settings.js
 */
const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');
const {
  connectHermes,
  evaluate,
  getWebSocketUrl,
} = require('./hermes/cdpClient');
const { buildNavigateExpression } = require('./hermes/navHelpers');

const OUT_DIR = path.resolve(
  __dirname,
  '../../../good-foods-description/img/pro/visuals'
);
const RAW = path.join(OUT_DIR, '_raw/customer');
const SHOTS = path.join(OUT_DIR, 'shots');
fs.mkdirSync(RAW, { recursive: true });
fs.mkdirSync(SHOTS, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function adbScreencap(destPng) {
  execSync(`adb exec-out screencap -p > "${destPng}"`, {
    shell: '/bin/zsh',
    stdio: 'inherit',
  });
}

function jpgFromPng(png, jpg) {
  try {
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '82', png, '--out', jpg]);
  } catch {
    fs.copyFileSync(png, jpg);
  }
}

async function waitForHermes(timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const url = await getWebSocketUrl();
      if (url) return url;
    } catch (_) {}
    await sleep(1000);
  }
  throw new Error('Hermes target not ready');
}

async function withWs(fn) {
  const ws = await connectHermes();
  try {
    return await fn(ws);
  } finally {
    try {
      ws.close();
    } catch (_) {}
  }
}

(async () => {
  console.log('1) Check Hermes + set Arabic (reload for RTL)...');
  await waitForHermes();

  let before = await withWs((ws) =>
    evaluate(ws, `(function(){
      if (typeof globalThis.__hermesGetLanguage === 'function') return globalThis.__hermesGetLanguage();
      return JSON.stringify({ error: 'hook missing — reload Metro / app' });
    })()`)
  );
  console.log('before', before);

  const setResult = await withWs((ws) =>
    evaluate(
      ws,
      `(async function(){
        if (typeof globalThis.__hermesSetLanguage !== 'function') {
          return JSON.stringify({ error: 'hook missing' });
        }
        return await globalThis.__hermesSetLanguage('ar', { reload: true });
      })()`,
      { awaitPromise: true }
    )
  );
  console.log('setLanguage', setResult);

  console.log('2) Wait for reload...');
  await sleep(8000);
  await waitForHermes();

  let after = await withWs((ws) =>
    evaluate(ws, `(function(){
      if (typeof globalThis.__hermesGetLanguage === 'function') return globalThis.__hermesGetLanguage();
      return JSON.stringify({ error: 'hook missing after reload' });
    })()`)
  );
  console.log('after', after);

  if (!after?.isRTL || after?.locale !== 'ar') {
    console.warn('RTL/locale not confirmed — capture anyway');
  }

  console.log('3) Navigate Settings...');
  const nav = await withWs((ws) =>
    evaluate(ws, buildNavigateExpression('Settings'))
  );
  console.log('nav', nav);
  await sleep(2500);

  const png = path.join(RAW, 'settings-ar-rtl.png');
  const jpg = path.join(SHOTS, 'c-settings-ar.jpg');
  adbScreencap(png);
  jpgFromPng(png, jpg);
  fs.copyFileSync(jpg, path.join(SHOTS, 'c-settings.jpg'));
  console.log('saved', png, jpg);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
