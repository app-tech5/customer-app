#!/usr/bin/env node
/**
 * Vérifie la Home customer : catégories, bannière promo, badges, section Special Offers.
 *
 *   node scripts/hermes-home-promotions-test.js
 */

const fs = require('fs');
const path = require('path');
const { connectHermes, evaluate, installAutoOkAlerts } = require('./hermes/cdpClient');
const { buildNavigateHomeExpression } = require('./hermes/navHelpers');

const SNAPSHOT_PATH = path.join(__dirname, 'hermes-home-promotions-snapshot.json');

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

    if (typeof props.children === 'string') {
      var text = props.children.trim();
      if (text.indexOf('Special Offers') >= 0 || text.indexOf('Offres du moment') >= 0 || text.indexOf('Offres spéciales') >= 0) {
        ctx.specialOffersTitle = text;
      }
      if (
        text.indexOf('Delivery') >= 0 ||
        text.indexOf('Livraison') >= 0 ||
        text.indexOf('%') >= 0 ||
        text.indexOf('Weekend') >= 0 ||
        text.indexOf('week-end') >= 0 ||
        text.indexOf('Welcome') >= 0 ||
        text.indexOf('bienvenue') >= 0
      ) {
        ctx.promoBannerTexts.push(text);
      }
    }

    walk(fiber.child, depth + 1, ctx);
    walk(fiber.sibling, depth, ctx);
  }

  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return JSON.stringify({ error: 'Pas de hook React' });

  var ctx = {
    onHome: false,
    hasCategories: false,
    hasPromoBanner: false,
    promotionBadges: 0,
    specialOffersTitle: null,
    promoBannerTexts: [],
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

  const nav = await evaluate(ws, buildNavigateHomeExpression());
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const state = await evaluate(ws, READ_HOME_MARKETING_STATE);
  ws.close();

  const snapshot = {
    capturedAt: new Date().toISOString(),
    navigation: nav,
    state,
  };

  fs.writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);

  const failures = [];
  if (!state.onHome) failures.push('Home screen not mounted');
  if (!state.hasCategories) failures.push('Categories component missing');
  if (!state.hasPromoBanner) failures.push('HomePromoBanner missing');
  if ((state.promoBannerTexts || []).length < 1) failures.push('Promo banner has no visible headline');
  if ((state.promotionBadges || 0) < 1) failures.push('No PromotionBadge visible on Home');
  if (!state.specialOffersTitle) failures.push('Special Offers section title not visible');

  console.log(JSON.stringify(snapshot, null, 2));

  if (failures.length > 0) {
    console.error('\n❌ Hermes home marketing checks failed:');
    failures.forEach((item) => console.error(`  - ${item}`));
    process.exit(1);
  }

  console.log('\n✅ Hermes home marketing checks passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
