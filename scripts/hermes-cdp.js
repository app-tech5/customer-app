#!/usr/bin/env node
/**
 * WebSocket → Hermes (CDP) pour la customer app.
 *
 *   node scripts/hermes-cdp.js
 *   node scripts/hermes-cdp.js home
 */

const { connectHermes, evaluate, installAutoOkAlerts } = require('./hermes/cdpClient');
const { buildNavigateHomeExpression } = require('./hermes/navHelpers');

const READ_HOME_MARKETING_STATE = `(function(){
  function fiberName(fiber) {
    if (!fiber || !fiber.type) return '';
    var t = fiber.type;
    if (typeof t === 'string') return t;
    return t.displayName || t.name || (t.render && t.render.displayName) || '';
  }

  function walk(fiber, depth, ctx) {
    if (!fiber || depth > 700) return;
    var n = fiberName(fiber);
    var props = fiber.memoizedProps || {};

    if (n === 'Home') ctx.onHome = true;
    if (n === 'Categories') ctx.hasCategories = true;
    if (n === 'HomePromoBanner') ctx.hasPromoBanner = true;
    if (n === 'PromotionBadge') ctx.promotionBadges += 1;

    walk(fiber.child, depth + 1, ctx);
    walk(fiber.sibling, depth, ctx);
  }

  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return JSON.stringify({ error: 'Pas de hook React' });

  var ctx = { onHome: false, hasCategories: false, hasPromoBanner: false, promotionBadges: 0 };
  hook.renderers.forEach(function(_, rendererID) {
    hook.getFiberRoots(rendererID).forEach(function(root) {
      walk(root.current || root, 0, ctx);
    });
  });

  return JSON.stringify(ctx);
})()`;

async function main() {
  const command = process.argv[2] || 'home';
  const ws = await connectHermes();
  await installAutoOkAlerts(ws);

  if (command === 'home') {
    const nav = await evaluate(ws, buildNavigateHomeExpression());
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const state = await evaluate(ws, READ_HOME_MARKETING_STATE);
    console.log(JSON.stringify({ navigation: nav, state }, null, 2));
    ws.close();
    return;
  }

  console.error(`Commande inconnue: ${command}`);
  ws.close();
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
