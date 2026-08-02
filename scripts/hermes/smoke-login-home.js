#!/usr/bin/env node
/**
 * Hermes CDP smoke: live API login → Home with restaurants.
 * Requires: Metro + debug app open (emulator/device).
 *
 *   METRO_URL=http://127.0.0.1:8081 node scripts/hermes/smoke-login-home.js
 */

const { connectHermes, evaluate, installAutoOkAlerts } = require('./cdpClient');
const { buildNavigateHomeExpression } = require('./navHelpers');

const EMAIL = process.env.E2E_EMAIL || 'demo@customer.com';
const PASSWORD = process.env.E2E_PASSWORD || 'demo123';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function evaluateJson(ws, expression, { awaitPromise = false, timeoutMs = 60000 } = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1e6);
    const timer = setTimeout(() => reject(new Error(`Timeout CDP (${timeoutMs}ms)`)), timeoutMs);

    const onMessage = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id !== id) return;
      clearTimeout(timer);
      ws.removeListener('message', onMessage);
      if (msg.result?.exceptionDetails) {
        reject(new Error(JSON.stringify(msg.result.exceptionDetails)));
        return;
      }
      const val = msg.result?.result?.value;
      if (typeof val === 'string') {
        try {
          resolve(JSON.parse(val));
        } catch {
          resolve(val);
        }
        return;
      }
      resolve(msg.result?.result ?? msg.result);
    };

    ws.on('message', onMessage);
    ws.send(JSON.stringify({
      id,
      method: 'Runtime.evaluate',
      params: { expression, returnByValue: true, awaitPromise },
    }));
  });
}

const READ_HOME_STATE = `(function(){
  function fiberName(fiber) {
    if (!fiber || !fiber.type) return '';
    var t = fiber.type;
    if (typeof t === 'string') return t;
    return t.displayName || t.name || (t.render && t.render.displayName) || '';
  }
  function walk(fiber, depth, ctx) {
    if (!fiber || depth > 800) return;
    var n = fiberName(fiber);
    var props = fiber.memoizedProps || {};
    if (n === 'Home') ctx.onHome = true;
    if (n === 'RestaurantItems' || n === 'RestaurantImage' || n === 'RestaurantInfo') {
      ctx.restaurantUi += 1;
    }
    if (typeof props.children === 'string') {
      var text = props.children.trim();
      if (text.indexOf('Special Offers') >= 0 || text.indexOf('Offres') >= 0) ctx.hasOffersTitle = true;
      if (text.indexOf('Top Rated') >= 0 || text.indexOf('Mieux not') >= 0) ctx.hasTopRated = true;
      if (text.indexOf('Sign In') >= 0 || text.indexOf('Connexion') >= 0) ctx.seesSignIn = true;
      if (text.indexOf('Continue') >= 0 || text.indexOf('Continuer') >= 0) ctx.seesContinue = true;
    }
    if (props.restaurantData && Array.isArray(props.restaurantData)) {
      ctx.restaurantDataCount = Math.max(ctx.restaurantDataCount, props.restaurantData.length);
    }
    walk(fiber.child, depth + 1, ctx);
    walk(fiber.sibling, depth, ctx);
  }
  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return JSON.stringify({ error: 'Pas de hook React DevTools' });
  var ctx = {
    onHome: false,
    restaurantUi: 0,
    restaurantDataCount: 0,
    hasOffersTitle: false,
    hasTopRated: false,
    seesSignIn: false,
    seesContinue: false,
  };
  hook.renderers.forEach(function(_, rendererID) {
    hook.getFiberRoots(rendererID).forEach(function(root) {
      walk(root.current || root, 0, ctx);
    });
  });
  return JSON.stringify(ctx);
})()`;

async function main() {
  const ws = await connectHermes();
  await installAutoOkAlerts(ws);

  const loginExpr = `(async function(){
    if (typeof globalThis.__HERMES_E2E_LOGIN__ !== 'function') {
      return JSON.stringify({ ok: false, error: 'login hook missing — rebuild debug app with hermesE2eHooks' });
    }
    var result = await globalThis.__HERMES_E2E_LOGIN__(${JSON.stringify(EMAIL)}, ${JSON.stringify(PASSWORD)});
    return JSON.stringify(result);
  })()`;

  console.log('→ Hermes login via live API…');
  const login = await evaluateJson(ws, loginExpr, { awaitPromise: true, timeoutMs: 90000 });
  console.log('login:', login);
  if (!login || login.ok !== true) {
    ws.close();
    console.error('❌ Login failed', login);
    process.exit(1);
  }

  await sleep(2500);
  const nav = await evaluate(ws, buildNavigateHomeExpression());
  console.log('navigate home:', nav);
  await sleep(3500);

  let state = await evaluate(ws, READ_HOME_STATE);
  console.log('home state:', state);

  for (let i = 0; i < 8 && state && !state.onHome; i += 1) {
    await sleep(1500);
    state = await evaluate(ws, READ_HOME_STATE);
    console.log(`home state retry ${i + 1}:`, state);
  }

  ws.close();

  const failures = [];
  if (state?.error) failures.push(state.error);
  if (!state?.onHome) failures.push('Home screen not mounted after login');
  if ((state?.restaurantDataCount || 0) < 1 && (state?.restaurantUi || 0) < 1) {
    failures.push('No restaurants visible on Home');
  }

  if (failures.length) {
    console.error('\n❌ Hermes login→home smoke failed:');
    failures.forEach((f) => console.error(`  - ${f}`));
    process.exit(1);
  }

  console.log('\n✅ Hermes login→home smoke passed (live API)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
