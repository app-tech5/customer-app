#!/usr/bin/env node
/**
 * Mesure la bannière promo Home via Hermes (positions + screenshot adb).
 *
 *   node scripts/hermes-home-banner-measure.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { connectHermes, evaluate, installAutoOkAlerts } = require('./hermes/cdpClient');
const { buildNavigateHomeExpression } = require('./hermes/navHelpers');

const SNAPSHOT_PATH = path.join(__dirname, 'hermes-home-banner-measure.json');
const SCREENSHOT_PATH = path.join(__dirname, 'hermes-home-banner-screenshot.png');

const MEASURE_BANNER = `(function(){
  function fiberName(fiber) {
    if (!fiber || !fiber.type) return '';
    var t = fiber.type;
    if (typeof t === 'string') return t;
    return t.displayName || t.name || '';
  }

  function walk(fiber, depth, ctx) {
    if (!fiber || depth > 900) return;
    if (fiberName(fiber) === 'HomePromoBanner') ctx.bannerFiber = fiber;
    walk(fiber.child, depth + 1, ctx);
    walk(fiber.sibling, depth, ctx);
  }

  function measureNode(stateNode) {
    return new Promise(function(resolve) {
      var pi = stateNode && stateNode.canonical && stateNode.canonical.publicInstance;
      if (!pi || typeof pi.measureInWindow !== 'function') {
        resolve(null);
        return;
      }
      pi.measureInWindow(function(x, y, w, h) {
        resolve({ x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) });
      });
    });
  }

  async function collectCards(fiber, depth, cards) {
    if (!fiber || depth > 60) return;
    if (fiber.stateNode && fiber.stateNode.canonical) {
      var rect = await measureNode(fiber.stateNode);
      if (rect && rect.width > 250 && rect.height >= 140 && rect.height <= 200) {
        cards.push(rect);
      }
    }
    await collectCards(fiber.child, depth + 1, cards);
    await collectCards(fiber.sibling, depth, cards);
  }

  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return JSON.stringify({ error: 'Pas de hook React' });

  var ctx = {};
  hook.renderers.forEach(function(_, rendererID) {
    hook.getFiberRoots(rendererID).forEach(function(root) {
      walk(root.current || root, 0, ctx);
    });
  });

  if (!ctx.bannerFiber) return JSON.stringify({ error: 'HomePromoBanner introuvable' });

  return collectCards(ctx.bannerFiber, 0, []).then(function(cards) {
    var unique = [];
    cards.forEach(function(card) {
      var exists = unique.some(function(item) {
        return Math.abs(item.x - card.x) < 8 && Math.abs(item.width - card.width) < 8;
      });
      if (!exists) unique.push(card);
    });
    unique.sort(function(a, b) { return a.x - b.x; });
    return JSON.stringify({ cards: unique });
  });
})()`;

async function captureScreenshot() {
  try {
    const png = execSync('adb exec-out screencap -p', { encoding: 'buffer', maxBuffer: 10 * 1024 * 1024 });
    fs.writeFileSync(SCREENSHOT_PATH, png);
    return SCREENSHOT_PATH;
  } catch (error) {
    return null;
  }
}

async function main() {
  const ws = await connectHermes();
  await installAutoOkAlerts(ws);
  await evaluate(ws, buildNavigateHomeExpression());
  await new Promise((resolve) => setTimeout(resolve, 1800));

  const measure = await evaluate(ws, MEASURE_BANNER, { awaitPromise: true });
  ws.close();

  const screenshot = await captureScreenshot();
  const snapshot = {
    capturedAt: new Date().toISOString(),
    measure,
    screenshot,
  };

  fs.writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(JSON.stringify(snapshot, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
