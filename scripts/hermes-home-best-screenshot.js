#!/usr/bin/env node
/**
 * Explore la Home (scroll vertical + horizontal par section), capture des screenshots,
 * sélectionne la meilleure pour le visuel marketing "4 apps".
 *
 *   node scripts/hermes-home-best-screenshot.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { connectHermes, evaluate, installAutoOkAlerts } = require('./hermes/cdpClient');
const { buildNavigateHomeExpression } = require('./hermes/navHelpers');

const OUT_DIR = path.join(__dirname, 'screenshots', 'home-candidates');
const BEST_PATH = path.join(__dirname, '..', '..', '..', 'good-foods-description', 'img', 'screenshots', 'customer-app.png');
const LOCAL_BEST = path.join(__dirname, 'screenshots', 'customer-app-best.png');
const REPORT_PATH = path.join(OUT_DIR, 'capture-report.json');

const VERTICAL_OFFSETS = [0, 120, 240, 360, 480];
const HORIZONTAL_OFFSETS = [0, 220, 440];
const PROMO_SLIDES = [0, 1, 2];

const DISCOVER_SCROLL_TARGETS = `(function(){
  function fiberName(fiber) {
    if (!fiber || !fiber.type) return '';
    var t = fiber.type;
    if (typeof t === 'string') return t;
    return t.displayName || t.name || (t.render && t.render.displayName) || '';
  }

  function walk(fiber, depth, visit) {
    if (!fiber || depth > 900) return;
    visit(fiber, depth);
    walk(fiber.child, depth + 1, visit);
    walk(fiber.sibling, depth, visit);
  }

  function getScrollable(fiber) {
    var ref = fiber.ref;
    if (ref && ref.current) {
      var r = ref.current;
      if (typeof r.scrollTo === 'function') return { type: 'scrollTo', node: r };
      if (typeof r.scrollToOffset === 'function') return { type: 'scrollToOffset', node: r };
      if (r.getScrollResponder) {
        try {
          var resp = r.getScrollResponder();
          if (resp && typeof resp.scrollTo === 'function') return { type: 'scrollTo', node: resp };
        } catch (e) {}
      }
    }
    var sn = fiber.stateNode;
    if (sn && typeof sn.scrollTo === 'function') return { type: 'scrollTo', node: sn };
    if (sn && sn.canonical && sn.canonical.publicInstance) {
      var pi = sn.canonical.publicInstance;
      if (pi && typeof pi.scrollTo === 'function') return { type: 'scrollTo', node: pi };
    }
    return null;
  }

  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return JSON.stringify({ error: 'Pas de hook React' });

  var mainScroll = null;
  var horizontalLists = [];
  var promoList = null;

  hook.renderers.forEach(function(_, rendererID) {
    hook.getFiberRoots(rendererID).forEach(function(root) {
      walk(root.current || root, 0, function(fiber, depth) {
        var name = fiberName(fiber);
        var scrollable = getScrollable(fiber);
        if (!scrollable) return;

        if (name.indexOf('ScrollView') >= 0 && !mainScroll) {
          mainScroll = scrollable;
        }
        if (name === 'HomePromoBanner' || (name.indexOf('FlatList') >= 0 && fiber.return && fiberName(fiber.return) === 'HomePromoBanner')) {
          promoList = scrollable;
        }
        if (name.indexOf('FlatList') >= 0 || name === 'VirtualizedList') {
          horizontalLists.push(scrollable);
        }
      });
    });
  });

  globalThis.__HOME_CAPTURE_SCROLL__ = {
    mainScroll: mainScroll,
    horizontalLists: horizontalLists,
    promoList: promoList,
  };

  return JSON.stringify({
    mainScroll: !!mainScroll,
    horizontalLists: horizontalLists.length,
    promoList: !!promoList,
  });
})()`;

const SCROLL_MAIN = (y) => `(function(){
  var t = globalThis.__HOME_CAPTURE_SCROLL__;
  if (!t || !t.mainScroll) return JSON.stringify({ error: 'main scroll introuvable' });
  try {
    t.mainScroll.node.scrollTo({ x: 0, y: ${y}, animated: false });
    return JSON.stringify({ ok: true, y: ${y} });
  } catch (e) {
    return JSON.stringify({ error: String(e) });
  }
})()`;

const SCROLL_PROMO = (index) => `(function(){
  var t = globalThis.__HOME_CAPTURE_SCROLL__;
  if (!t || !t.promoList) return JSON.stringify({ error: 'promo list introuvable' });
  try {
    if (typeof t.promoList.node.scrollToIndex === 'function') {
      t.promoList.node.scrollToIndex({ index: ${index}, animated: false });
    } else if (typeof t.promoList.node.scrollToOffset === 'function') {
      var w = require('react-native').Dimensions.get('window').width;
      t.promoList.node.scrollToOffset({ offset: w * ${index}, animated: false });
    }
    return JSON.stringify({ ok: true, index: ${index} });
  } catch (e) {
    return JSON.stringify({ error: String(e) });
  }
})()`;

const SCROLL_HORIZONTAL = (listIndex, offset) => `(function(){
  var t = globalThis.__HOME_CAPTURE_SCROLL__;
  if (!t || !t.horizontalLists || !t.horizontalLists[${listIndex}]) {
    return JSON.stringify({ error: 'horizontal list introuvable' });
  }
  try {
    t.horizontalLists[${listIndex}].node.scrollToOffset({ offset: ${offset}, animated: false });
    return JSON.stringify({ ok: true, list: ${listIndex}, offset: ${offset} });
  } catch (e) {
    return JSON.stringify({ error: String(e) });
  }
})()`;

const SCORE_VIEWPORT = `(function(){
  function fiberName(fiber) {
    if (!fiber || !fiber.type) return '';
    var t = fiber.type;
    if (typeof t === 'string') return t;
    return t.displayName || t.name || '';
  }

  function walk(fiber, depth, ctx) {
    if (!fiber || depth > 900) return;
    var n = fiberName(fiber);
    var props = fiber.memoizedProps || {};

    if (n === 'Home') ctx.onHome = true;
    if (n === 'HeaderTabs') ctx.hasHeaderTabs = true;
    if (n === 'SearchBar') ctx.hasSearchBar = true;
    if (n === 'Categories') ctx.hasCategories = true;
    if (n === 'HomePromoBanner') ctx.hasPromoBanner = true;
    if (n === 'PromotionBadge') ctx.promotionBadges += 1;

    if (typeof props.children === 'string') {
      var text = props.children.trim();
      if (text === 'Delivery' || text === 'Livraison') ctx.hasDeliveryTab = true;
      if (text.indexOf('Special Offers') >= 0 || text.indexOf('Offres du moment') >= 0) ctx.hasSpecialOffers = true;
      if (text.indexOf('Top Rated') >= 0 || text.indexOf('Mieux notés') >= 0) ctx.hasTopRated = true;
      if (text.indexOf('Quick Cuisine') >= 0 || text.indexOf('Cuisine rapide') >= 0) ctx.hasQuickCuisine = true;
      if (text.indexOf('%') >= 0 && text.indexOf('off') >= 0) ctx.badgeTexts.push(text);
      if (text.indexOf('Delivery Fee') >= 0 || text.indexOf('Livraison') >= 0) ctx.promoTexts.push(text);
    }

    walk(fiber.child, depth + 1, ctx);
    walk(fiber.sibling, depth, ctx);
  }

  function measureNode(stateNode) {
    return new Promise(function(resolve) {
      var pi = stateNode && stateNode.canonical && stateNode.canonical.publicInstance;
      if (!pi || typeof pi.measureInWindow !== 'function') return resolve(null);
      pi.measureInWindow(function(x, y, w, h) {
        resolve({ x: x, y: y, width: w, height: h });
      });
    });
  }

  async function measureCategories(ctx) {
    var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    var catFiber = null;
    hook.renderers.forEach(function(_, id) {
      hook.getFiberRoots(id).forEach(function(root) {
        function find(f) {
          if (!f) return;
          if (fiberName(f) === 'Categories') catFiber = f;
          find(f.child); find(f.sibling);
        }
        find(root.current || root);
      });
    });
    if (!catFiber) return;
    async function collect(f, d) {
      if (!f || d > 30) return;
      if (f.stateNode && f.stateNode.canonical) {
        var rect = await measureNode(f.stateNode);
        if (rect && rect.width > 200 && rect.height > 40 && rect.height < 120) {
          ctx.categoryRect = rect;
        }
      }
      await collect(f.child, d + 1);
      await collect(f.sibling, d);
    }
    await collect(catFiber, 0);
  }

  var hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) return JSON.stringify({ error: 'Pas de hook React', score: 0 });

  var ctx = {
    onHome: false,
    hasHeaderTabs: false,
    hasSearchBar: false,
    hasCategories: false,
    hasPromoBanner: false,
    hasSpecialOffers: false,
    hasTopRated: false,
    hasQuickCuisine: false,
    hasDeliveryTab: false,
    promotionBadges: 0,
    badgeTexts: [],
    promoTexts: [],
    categoryRect: null,
  };

  hook.renderers.forEach(function(_, rendererID) {
    hook.getFiberRoots(rendererID).forEach(function(root) {
      walk(root.current || root, 0, ctx);
    });
  });

  return measureCategories(ctx).then(function() {
    var score = 0;
    if (ctx.onHome) score += 5;
    if (ctx.hasHeaderTabs) score += 12;
    if (ctx.hasSearchBar) score += 10;
    if (ctx.hasDeliveryTab) score += 8;
    if (ctx.hasCategories) score += 18;
    if (ctx.hasPromoBanner) score += 22;
    if (ctx.hasSpecialOffers) score += 16;
    if (ctx.hasTopRated) score += 10;
    if (ctx.hasQuickCuisine) score += 6;
    score += Math.min(ctx.promotionBadges, 4) * 5;
    if (ctx.badgeTexts.length >= 2) score += 8;
    if (ctx.categoryRect && ctx.categoryRect.y >= 0 && ctx.categoryRect.y < 900) score += 6;

  if (!ctx.hasHeaderTabs) score -= 20;
  if (!ctx.hasCategories && !ctx.hasPromoBanner) score -= 15;

    return JSON.stringify({
      score: score,
      metrics: {
        onHome: ctx.onHome,
        hasHeaderTabs: ctx.hasHeaderTabs,
        hasSearchBar: ctx.hasSearchBar,
        hasCategories: ctx.hasCategories,
        hasPromoBanner: ctx.hasPromoBanner,
        hasSpecialOffers: ctx.hasSpecialOffers,
        hasTopRated: ctx.hasTopRated,
        hasQuickCuisine: ctx.hasQuickCuisine,
        promotionBadges: ctx.promotionBadges,
        badgeTexts: ctx.badgeTexts.slice(0, 4),
        promoTexts: ctx.promoTexts.slice(0, 2),
      },
    });
  });
})()`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function captureScreenshot(filePath) {
  const png = execSync('adb exec-out screencap -p', {
    encoding: 'buffer',
    maxBuffer: 15 * 1024 * 1024,
  });
  fs.writeFileSync(filePath, png);
  return filePath;
}

function adbSwipeVertical(toTop) {
  const y1 = toTop ? 1400 : 600;
  const y2 = toTop ? 2200 : 1400;
  execSync(`adb shell input swipe 540 ${y1} 540 ${y2} 350`, { stdio: 'ignore' });
}

async function resetToTop(ws) {
  await evaluate(ws, SCROLL_MAIN(0));
  await sleep(300);
  for (let i = 0; i < 4; i += 1) {
    adbSwipeVertical(true);
    await sleep(250);
  }
  await evaluate(ws, SCROLL_MAIN(0));
  await sleep(400);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const ws = await connectHermes();
  await installAutoOkAlerts(ws);
  await evaluate(ws, buildNavigateHomeExpression());
  await sleep(2000);
  await evaluate(ws, DISCOVER_SCROLL_TARGETS);
  await resetToTop(ws);

  const captures = [];

  for (const promoIndex of PROMO_SLIDES) {
    await evaluate(ws, SCROLL_PROMO(promoIndex));
    await sleep(600);

    for (const verticalY of VERTICAL_OFFSETS) {
      await evaluate(ws, SCROLL_MAIN(verticalY));
      await sleep(500);

      const horizontalPlans = [
        { listIndex: 0, offset: 0 },
        { listIndex: 0, offset: 220 },
        { listIndex: 1, offset: 0 },
        { listIndex: 1, offset: 220 },
      ];

      for (const plan of horizontalPlans) {
        await evaluate(ws, SCROLL_HORIZONTAL(plan.listIndex, plan.offset));
        await sleep(450);

        const scoreResult = await evaluate(ws, SCORE_VIEWPORT, { awaitPromise: true });
        const id = `p${promoIndex}_y${verticalY}_h${plan.listIndex}-${plan.offset}`;
        const filePath = path.join(OUT_DIR, `${id}.png`);

        captureScreenshot(filePath);

        captures.push({
          id,
          file: filePath,
          promoIndex,
          verticalY,
          horizontalList: plan.listIndex,
          horizontalOffset: plan.offset,
          score: scoreResult.score || 0,
          metrics: scoreResult.metrics || scoreResult,
        });

        process.stdout.write(`Captured ${id} → score ${scoreResult.score || 0}\n`);
      }
    }
  }

  ws.close();

  captures.sort((a, b) => b.score - a.score);
  const best = captures[0];

  if (!best) {
    console.error('Aucune capture');
    process.exit(1);
  }

  fs.copyFileSync(best.file, LOCAL_BEST);
  if (fs.existsSync(path.dirname(BEST_PATH))) {
    fs.copyFileSync(best.file, BEST_PATH);
  }

  const report = {
    capturedAt: new Date().toISOString(),
    totalCaptures: captures.length,
    best: {
      id: best.id,
      score: best.score,
      metrics: best.metrics,
      source: best.file,
      output: BEST_PATH,
    },
    top5: captures.slice(0, 5).map((c) => ({
      id: c.id,
      score: c.score,
      metrics: c.metrics,
    })),
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log('\n=== Meilleure capture ===');
  console.log(JSON.stringify(report.best, null, 2));
  console.log(`\nCopié vers: ${BEST_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
