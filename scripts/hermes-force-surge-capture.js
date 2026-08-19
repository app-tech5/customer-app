#!/usr/bin/env node
/**
 * Force surge badge on open restaurant screen via Hermes, then ADB full capture.
 */
const fs = require('fs');
const { execSync } = require('child_process');
const { connectHermes, evaluate, installAutoOkAlerts } = require('./hermes/cdpClient');

const ADB = process.env.ADB || '/Users/nass/Library/Android/sdk/platform-tools/adb';
const OUT_RAW =
  '/Users/nass/Documents/good-foods-description/img/pro/visuals/shots/ai-surge-raw.png';
const OUT_JPG =
  '/Users/nass/Documents/good-foods-description/img/pro/visuals/shots/ai-surge.jpg';

const FORCE_SURGE = `(function(){
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return JSON.stringify({ error: 'Pas de hook React' });

  function fiberName(fiber) {
    if (!fiber || !fiber.type) return '';
    var t = fiber.type;
    if (typeof t === 'string') return t;
    return t.displayName || t.name || (t.render && (t.render.displayName || t.render.name)) || '';
  }

  function walk(fiber, depth, visit) {
    if (!fiber || depth > 900) return;
    visit(fiber);
    walk(fiber.child, depth + 1, visit);
    walk(fiber.sibling, depth, visit);
  }

  var target = null;
  hook.renderers.forEach(function(_, rendererID) {
    hook.getFiberRoots(rendererID).forEach(function(root) {
      walk(root.current || root, 0, function(fiber) {
        if (fiberName(fiber) === 'IntelligenceBadges') target = fiber;
      });
    });
  });

  if (!target) return JSON.stringify({ error: 'IntelligenceBadges introuvable' });

  var quoteHook = target.memoizedState;
  if (!quoteHook || !quoteHook.queue || typeof quoteHook.queue.dispatch !== 'function') {
    return JSON.stringify({ error: 'quote hook introuvable' });
  }

  var prev = quoteHook.memoizedState || {};
  var next = Object.assign({}, prev, {
    eta: Object.assign({}, prev.eta || {}, {
      minMinutes: (prev.eta && prev.eta.minMinutes) || 26,
      maxMinutes: (prev.eta && prev.eta.maxMinutes) || 36,
      label: (prev.eta && prev.eta.label) || '26–36 min',
    }),
    surge: {
      active: true,
      multiplier: 1.45,
      label: '1.45x delivery fee',
      reasons: ['High order demand vs available drivers', 'Rush hour'],
      factors: (prev.surge && prev.surge.factors) || {},
    },
  });

  quoteHook.queue.dispatch(next);
  return JSON.stringify({ ok: true, eta: next.eta.label, multiplier: next.surge.multiplier });
})()`;

async function main() {
  const ws = await connectHermes();
  await installAutoOkAlerts(ws);
  const result = await evaluate(ws, FORCE_SURGE);
  console.log('force', result);
  ws.close();
  if (result?.error) {
    process.exitCode = 1;
    return;
  }

  await new Promise((r) => setTimeout(r, 800));
  execSync(`${ADB} exec-out screencap -p > "${OUT_RAW}"`, { shell: '/bin/zsh' });
  execSync(`sips -s format jpeg -s formatOptions 85 "${OUT_RAW}" --out "${OUT_JPG}" >/dev/null`);
  execSync(`sips --resampleWidth 420 "${OUT_JPG}" >/dev/null`);
  console.log('shot', OUT_JPG, Math.round(fs.statSync(OUT_JPG).size / 1024) + 'KB');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
