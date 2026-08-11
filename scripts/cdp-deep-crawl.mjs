#!/usr/bin/env node
/**
 * Deep CDP crawl ONLY — labels from lang/en.json + screens from navigation/*.
 * No bridge, no CI. Verifies progress via screenshot MD5.
 */
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'

const require = createRequire(import.meta.url)
const WebSocket = require('/Users/nass/Documents/admin-app/node_modules/ws')
const en = JSON.parse(
  fs.readFileSync(
    '/Users/nass/Documents/good-food-app-main/customer-app/lang/en.json',
    'utf8'
  )
)

const OUT =
  '/Users/nass/Documents/good-foods-description/img/pro/visuals/out/qa-web/deep'
fs.mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const log = (...a) => console.log(...a)

const L = {
  home: en.drawer.home,
  search: en.drawer.search,
  cart: en.cart?.title || 'Your Cart',
  orders: en.drawer.orderHistory,
  account: en.drawer.account,
  nearMe: en.search.nearMe,
  offers: en.drawer.offers,
  wallet: en.drawer.wallet,
  settings: en.drawer.settings,
  favorites: en.drawer.favorites,
  editProfile: en.profile.edit,
  addresses: en.addresses.title,
  subscription: en.subscription.title,
  help: en.profile.help,
  about: en.profile.about,
  logout: en.drawer.logout,
  trending: en.search.trendingSearches,
  quickActions: en.search.quickActions,
  addMoney: en.wallet?.addMoney || 'Add Money',
  paymentMethods: en.wallet?.paymentMethods || 'Payment Methods',
}

const report = { visited: [], failed: [], shots: [], hashes: {} }

const pages = await (await fetch('http://127.0.0.1:9222/json/list')).json()
const demos = pages.filter(
  (p) => p.type === 'page' && (p.url || '').includes('demo/customer')
)
// Prefer explicit id, else first ALIVE tab (innerText length > 500). Never soft-reload.
let page = null
if (process.env.CDP_TAB) {
  page = demos.find((p) => p.id === process.env.CDP_TAB)
}
if (!page) {
  for (const p of demos.reverse()) {
    try {
      const ws0 = new WebSocket(p.webSocketDebuggerUrl)
      await new Promise((r, j) => {
        ws0.once('open', r)
        ws0.once('error', j)
        setTimeout(() => j(new Error('t')), 2000)
      })
      let n0 = 1
      const pend = new Map()
      ws0.on('message', (raw) => {
        const m = JSON.parse(raw)
        if (m.id && pend.has(m.id)) {
          const { resolve, reject } = pend.get(m.id)
          pend.delete(m.id)
          m.error ? reject() : resolve(m.result)
        }
      })
      const c0 = (method, params = {}) =>
        new Promise((resolve, reject) => {
          const id = n0++
          const t = setTimeout(() => {
            pend.delete(id)
            reject()
          }, 2500)
          pend.set(id, {
            resolve: (v) => {
              clearTimeout(t)
              resolve(v)
            },
            reject: () => {
              clearTimeout(t)
              reject()
            },
          })
          ws0.send(JSON.stringify({ id, method, params }))
        })
      await c0('Runtime.enable')
      const len = (
        await c0('Runtime.evaluate', {
          returnByValue: true,
          expression: `(document.body&&document.body.innerText||'').length`,
        })
      ).result.value
      ws0.close()
      if (len > 500) {
        page = p
        break
      }
    } catch {}
  }
}
if (!page) throw new Error('no ALIVE demo tab')
log('TAB', page.id, page.url)
try {
  await fetch('http://127.0.0.1:9222/json/activate/' + page.id)
} catch {}

const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((r, j) => {
  ws.once('open', r)
  ws.once('error', j)
})
let n = 1
const pending = new Map()
ws.on('message', (raw) => {
  const msg = JSON.parse(raw)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
  }
})
const c = (method, params = {}, timeoutMs = 25000) =>
  new Promise((resolve, reject) => {
    const id = n++
    const t = setTimeout(() => {
      pending.delete(id)
      reject(new Error('timeout ' + method))
    }, timeoutMs)
    pending.set(id, {
      resolve: (v) => {
        clearTimeout(t)
        resolve(v)
      },
      reject: (e) => {
        clearTimeout(t)
        reject(e)
      },
    })
    try {
      ws.send(JSON.stringify({ id, method, params }))
    } catch (e) {
      clearTimeout(t)
      pending.delete(id)
      reject(e)
    }
  })
await c('Page.enable')
await c('Runtime.enable')
try {
  await c('Page.bringToFront')
} catch {}

const touch = async (x, y) => {
  try {
    await c(
      'Input.dispatchTouchEvent',
      {
        type: 'touchStart',
        touchPoints: [{ x: Math.round(x), y: Math.round(y), id: 0 }],
      },
      12000
    )
    await sleep(35)
    await c('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }, 12000)
  } catch (e) {
    log('touch fail', e.message)
  }
}
const swipe = async (x, y1, y2) => {
  try {
    await c(
      'Input.dispatchTouchEvent',
      { type: 'touchStart', touchPoints: [{ x, y: y1, id: 0 }] },
      12000
    )
    for (let i = 1; i <= 10; i++) {
      await c(
        'Input.dispatchTouchEvent',
        {
          type: 'touchMove',
          touchPoints: [{ x, y: y1 + ((y2 - y1) * i) / 10, id: 0 }],
        },
        12000
      )
      await sleep(12)
    }
    await c('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }, 12000)
  } catch (e) {
    log('swipe fail', e.message)
  }
}

let shotIdx = 0
let lastHash = null
const shot = async (label) => {
  shotIdx++
  const name =
    String(shotIdx).padStart(3, '0') +
    '-' +
    label.replace(/[^\w.-]+/g, '_').slice(0, 70)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const s = await c(
        'Page.captureScreenshot',
        { format: 'jpeg', quality: 42, fromSurface: true },
        30000
      )
      const buf = Buffer.from(s.data, 'base64')
      fs.writeFileSync(path.join(OUT, name + '.jpg'), buf)
      const hash = createHash('md5').update(buf).digest('hex').slice(0, 12)
      report.shots.push(name)
      report.hashes[name] = hash
      const same = hash === lastHash
      lastHash = hash
      log('SHOT', name, hash, same ? 'SAME_AS_PREV' : 'NEW')
      return { name, hash, same }
    } catch (e) {
      log('SHOT FAIL', name, 'try', attempt, e.message)
      await sleep(800)
    }
  }
  report.failed.push('shot:' + label)
  return { name, hash: null, same: false }
}

/** Visible text nodes — NO pointer-events filter (that broke the previous crawl). */
const ui = async () =>
  (
    await c('Runtime.evaluate', {
      returnByValue: true,
      expression: `(()=>{
  const items=[];
  const w=document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while((n=w.nextNode())){
    const t=n.textContent.trim(); if(!t||t.length>70) continue;
    const el=n.parentElement; if(!el) continue;
    const r=el.getBoundingClientRect();
    if(r.width<2||r.height<2||r.right<=0||r.left>=innerWidth||r.bottom<=0||r.top>=innerHeight) continue;
    const st=getComputedStyle(el);
    if(st.visibility==='hidden'||st.display==='none'||+st.opacity===0) continue;
    items.push({t,x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),l:Math.round(r.left),top:Math.round(r.top),h:Math.round(r.height)});
  }
  const seen=new Set(), uniq=[];
  for(const it of items){ const k=it.t+'@'+it.top+'@'+it.l; if(seen.has(k)) continue; seen.add(k); uniq.push(it); }
  const tabs={};
  for(const name of [${JSON.stringify(L.home)},${JSON.stringify(L.search)},'Cart',${JSON.stringify(L.orders)},${JSON.stringify(L.account)}]){
    const hit=uniq.find(i=>i.t===name&&i.top>innerHeight-100); if(hit) tabs[name]=hit;
  }
  return {
    w:innerWidth,h:innerHeight,items:uniq,tabs,
    texts:uniq.map(i=>i.t),
    headers:uniq.filter(i=>i.top<95&&i.h>=12).map(i=>i.t),
    drawer:uniq.some(i=>i.t==='Demo Customer'&&i.l>=0&&i.l<50&&i.top<120),
    leaflet:!!document.querySelector('.leaflet-container'),
  };
})()`,
    })
  ).result.value

const back = async (times = 1) => {
  for (let i = 0; i < times; i++) {
    await touch(28, 56)
    await sleep(700)
  }
}
const closeDrawer = async () => {
  const u = await ui()
  if (u.drawer) {
    await touch(u.w - 20, Math.round(u.h * 0.45))
    await sleep(600)
  }
}
const tapTab = async (name) => {
  await closeDrawer()
  const u = await ui()
  const t = u.tabs[name]
  if (!t) {
    log('NO TAB', name, Object.keys(u.tabs))
    return false
  }
  await touch(t.x, t.y - 18)
  await sleep(1300)
  return true
}
const find = (u, labels, pred = () => true) => {
  const list = Array.isArray(labels) ? labels : [labels]
  for (const lab of list) {
    const hit = u.items.find((i) => (i.t === lab || i.t.startsWith(lab)) && pred(i))
    if (hit) return hit
  }
  return null
}
const scrollFind = async (labels, pred, max = 4) => {
  for (let i = 0; i < max; i++) {
    const u = await ui()
    const hit = find(u, labels, pred)
    if (hit) return hit
    await swipe(200, 540, 200)
    await sleep(280)
  }
  return null
}
const capture = async (id) => {
  const a = await shot(id + '-top')
  await swipe(200, 540, 180)
  await sleep(350)
  await shot(id + '-bot')
  report.visited.push(id)
  return a
}

/** Open by label, capture top+bot, optional dive, back. Max 2 tries. */
const visit = async (id, labels, { pred, dive, tab, maxTry = 2 } = {}) => {
  for (let tryN = 1; tryN <= maxTry; tryN++) {
    if (tab) {
      await tapTab(tab)
      await sleep(300)
    }
    const hit = await scrollFind(
      labels,
      pred || ((i) => i.top > 70 && i.top < 680),
      5
    )
    if (!hit) {
      log('MISS', id, labels, tryN)
      continue
    }
    log('OPEN', id, '←', hit.t, `@${hit.top}`)
    const before = lastHash
    await touch(hit.x, hit.y)
    await sleep(1500)
    const cap = await capture(id)
    if (cap.hash === before) log('WARN', id, 'screenshot unchanged after open')
    if (dive) {
      try {
        await dive()
      } catch (e) {
        log('dive fail', id, e.message)
      }
    }
    await back()
    await sleep(750)
    return true
  }
  report.failed.push(id)
  log('FAIL', id)
  return false
}

const openDrawer = async () => {
  await tapTab(L.home)
  await sleep(400)
  await touch(28, 52)
  await sleep(850)
  return ui()
}

// ========== CRAWL (no Page.navigate — reload kills the web bundle on device) ==========
await closeDrawer()
await capture('Home')

// --- TABS ---
await tapTab(L.search)
await sleep(400)
await capture('Search')

await visit('Search-TrendingPizza', ['Pizza'], {
  tab: L.search,
  pred: (i) => i.top > 150 && i.top < 520,
  dive: async () => {
    const u = await ui()
    const resto = u.items.find(
      (i) =>
        i.top > 120 &&
        i.top < 580 &&
        i.t.length > 4 &&
        i.t.length < 50 &&
        !/Pizza|Search|Filter|result|No |Home|Cart|km|min/i.test(i.t)
    )
    if (!resto) return
    await touch(resto.x, resto.y)
    await sleep(2000)
    await capture('Search-Pizza-Restaurant')
    for (let s = 0; s < 6; s++) {
      const uu = await ui()
      const dish = uu.items.find(
        (i) =>
          (i.t === '+' || /^\$?\d+\.\d{2}$/.test(i.t) || /Add to Cart/i.test(i.t)) &&
          i.top > 160 &&
          i.top < 640
      )
      if (dish) {
        await touch(dish.t === '+' || /Add/i.test(dish.t) ? dish.x : Math.max(60, dish.x - 90), dish.y)
        await sleep(1500)
        await capture('Search-Pizza-MenuDetail')
        const add = (await ui()).items.find((i) => /Add to Cart/i.test(i.t))
        if (add) {
          await touch(add.x, add.y)
          await sleep(900)
          await shot('Search-Pizza-Added')
        }
        await back()
        await sleep(700)
        break
      }
      await swipe(200, 500, 250)
      await sleep(320)
    }
    await back()
    await sleep(700)
  },
})

await visit('Search-CategoryAmerican', ['American'], {
  tab: L.search,
  pred: (i) => i.top > 200,
})
await visit('Search-QuickNearMe', [L.nearMe], {
  tab: L.search,
  pred: (i) => i.top > 120 && i.top < 420,
})
await visit('Search-QuickTopRated', [en.search.topRated], {
  tab: L.search,
  pred: (i) => i.top > 120 && i.top < 420,
})
await visit('Search-QuickFavorites', [en.search.favorites], {
  tab: L.search,
  pred: (i) => i.top > 120 && i.top < 420,
})
await visit('Search-QuickOffers', [en.search.offers], {
  tab: L.search,
  pred: (i) => i.top > 120 && i.top < 420 && i.t === en.search.offers,
})

// --- HOME → RESTAURANT → MENU ---
await tapTab(L.home)
await sleep(500)
await capture('Home-2')
{
  let ok = false
  for (let tryN = 1; tryN <= 2; tryN++) {
    const u = await ui()
    const resto = u.items.find(
      (i) =>
        i.top > 110 &&
        i.top < 600 &&
        i.t.length > 4 &&
        i.t.length < 45 &&
        !/Delivery|Pickup|Search|Special|Featured|View All|Browse|off|Home|Cart|Sponsored|Most Popular|Top Rated/i.test(
          i.t
        ) &&
        !/km|min preparation|Paris|\$\$/.test(i.t)
    )
    // prefer known demo names
    const named =
      u.items.find(
        (i) =>
          /Smith|Mosciski|Tromp|Ernser|Bayer|Herzog|Wisoky/i.test(i.t) &&
          i.top > 110 &&
          i.top < 620
      ) || resto
    if (!named) {
      await swipe(200, 520, 240)
      await sleep(350)
      continue
    }
    log('OPEN Home-Restaurant', named.t)
    await touch(named.x, named.y)
    await sleep(2200)
    await capture('Home-RestaurantDetail')
    ok = true
    for (let s = 0; s < 8; s++) {
      await shot('Home-Resto-sc' + s)
      const uu = await ui()
      const plus = uu.items.find(
        (i) => (i.t === '+' || i.t === 'Add') && i.top > 150 && i.top < 640
      )
      const price = uu.items.find(
        (i) => /^\$?\d+\.\d{2}$/.test(i.t) && i.top > 200 && i.top < 640
      )
      if (plus || price) {
        const t = plus || price
        await touch(plus ? plus.x : Math.max(70, price.x - 90), t.y)
        await sleep(1600)
        await capture('Home-MenuDetail')
        const add = (await ui()).items.find((i) => /Add to Cart/i.test(i.t))
        if (add) {
          await touch(add.x, add.y)
          await sleep(1000)
          await shot('Home-Added')
        }
        await back()
        await sleep(700)
        break
      }
      await swipe(200, 500, 250)
      await sleep(350)
    }
    // offer tap
    const offer = (await ui()).items.find(
      (i) => /Delivery Fee|% off|Lunch Special/i.test(i.t) && i.top > 100 && i.top < 500
    )
    if (offer) {
      await touch(offer.x, offer.y)
      await sleep(1200)
      await capture('Home-Resto-Offer')
      await back()
      await sleep(700)
    }
    await back()
    await sleep(900)
    break
  }
  if (!ok) report.failed.push('Home-RestaurantDetail')
}

// map button
await tapTab(L.home)
await sleep(400)
await touch(350, 56)
await sleep(1800)
await capture('Home-MapButton')
{
  const u = await ui()
  if (u.leaflet) {
    await swipe(200, 620, 280)
    await sleep(700)
    await shot('Home-Map-sheet')
  }
  await back()
  await sleep(700)
}

// --- CART ---
await tapTab('Cart')
await sleep(500)
await capture('Cart')
{
  const u = await ui()
  if (!u.texts.some((t) => /empty/i.test(t))) {
    const row = u.items.find(
      (i) =>
        i.top > 100 &&
        i.top < 500 &&
        i.t.length > 3 &&
        !/Your Cart|Cart|Checkout|Home|Search|Total/i.test(i.t)
    )
    if (row) {
      await touch(row.x, row.y)
      await sleep(1400)
      await capture('CartDetails')
      await back()
      await sleep(700)
    }
    const co = (await ui()).items.find((i) => /Checkout|Place order/i.test(i.t))
    if (co) {
      await touch(co.x, co.y)
      await sleep(1600)
      await capture('Checkout')
      const conf = (await ui()).items.find((i) =>
        /Confirm|Place order|Pay|Continue/i.test(i.t)
      )
      if (conf) {
        await touch(conf.x, conf.y)
        await sleep(1500)
        await capture('OrderConfirm')
        await back()
        await sleep(700)
      }
      await back()
      await sleep(700)
    }
  } else log('SKIP CartDetails (empty)')
}

// --- ORDERS DEPTH ---
await tapTab(L.orders)
await sleep(600)
await capture('Orders')
{
  const u = await ui()
  const row = u.items.find(
    (i) =>
      (/^#/.test(i.t) || /ago|Reorder|Track|Order #/i.test(i.t) || /\$\d/.test(i.t)) &&
      i.top > 100 &&
      i.top < 600
  )
  const trackBtn = u.items.find((i) => i.t === 'Track' || /Tracking/i.test(i.t))
  if (row) {
    await touch(row.x, row.y)
    await sleep(1500)
    await capture('OrderDetails')
    const tr = (await ui()).items.find((i) => /Track|Tracking/i.test(i.t) && i.top > 80)
    if (tr) {
      await touch(tr.x, tr.y)
      await sleep(1400)
      await capture('OrderTracking')
      await back()
      await sleep(700)
    }
    const chat = (await ui()).items.find((i) => /Chat|Message/i.test(i.t))
    if (chat) {
      await touch(chat.x, chat.y)
      await sleep(1400)
      await capture('OrderChat')
      await back()
      await sleep(700)
    }
    await back()
    await sleep(800)
  } else if (trackBtn) {
    await touch(trackBtn.x, trackBtn.y)
    await sleep(1400)
    await capture('OrderTracking')
    await back()
    await sleep(700)
  } else log('SKIP OrderDetails')
}

// OrderDetails/Tracking hide the tab bar — back until tabs return
for (let i = 0; i < 6; i++) {
  const u = await ui()
  if (Object.keys(u.tabs).length >= 3) break
  log('restore-tabs', i, Object.keys(u.tabs))
  await back()
  await sleep(500)
}

// --- ACCOUNT DEPTH (labels from en.json) ---
await tapTab(L.account)
await sleep(700)
await capture('Account')

await visit('EditProfile', [L.editProfile], { tab: L.account })
await visit('Favorites', [L.favorites, 'Manage your favorite restaurants'], {
  tab: L.account,
  pred: (i) => i.top > 250,
  dive: async () => {
    const u = await ui()
    const card = u.items.find(
      (i) =>
        i.top > 120 &&
        i.top < 550 &&
        i.t.length > 4 &&
        !/Favorite|No |empty|Home|Search/i.test(i.t)
    )
    if (card) {
      await touch(card.x, card.y)
      await sleep(1800)
      await capture('Favorites-Restaurant')
      await back()
      await sleep(700)
    }
  },
})
await visit('Wallet', [L.wallet], {
  tab: L.account,
  pred: (i) => i.top > 200,
  dive: async () => {
    await visit('AddMoney', [L.addMoney], { maxTry: 1 })
    const u = await ui()
    const add = u.items.find(
      (i) => (i.t === 'Add' || i.t === '+ Add') && i.top > 250 && i.top < 450
    )
    if (add) {
      await touch(add.x, add.y)
      await sleep(1400)
      await capture('AddPaymentMethod')
      const card = (await ui()).items.find((i) => /Card|Credit|Add Card/i.test(i.t))
      if (card) {
        await touch(card.x, card.y)
        await sleep(1300)
        await capture('AddCard')
        await back()
        await sleep(700)
      }
      await back()
      await sleep(700)
    }
    const send = (await ui()).items.find((i) => i.t === 'Send')
    if (send) {
      await touch(send.x, send.y)
      await sleep(1300)
      await capture('Wallet-Send')
      await back()
      await sleep(700)
    }
  },
})
await visit('Subscription', [L.subscription], { tab: L.account })
await visit('Addresses', [L.addresses], {
  tab: L.account,
  dive: async () => {
    const u = await ui()
    const row = u.items.find(
      (i) =>
        i.top > 120 &&
        i.top < 550 &&
        i.t.length > 5 &&
        !/Address|Manage|delivery addresses/i.test(i.t)
    )
    const add = u.items.find((i) => /Add|New/i.test(i.t) && i.top < 200)
    if (row) {
      await touch(row.x, row.y)
      await sleep(1400)
      await capture('EditAddress')
      await back()
      await sleep(700)
    } else if (add) {
      await touch(add.x, add.y)
      await sleep(1400)
      await capture('AddAddress')
      await back()
      await sleep(700)
    }
  },
})
await visit('Settings', [L.settings], {
  tab: L.account,
  pred: (i) => i.top > 200,
  dive: async () => {
    for (const lab of ['Location Services', 'Data & Privacy', 'Language', 'Notifications']) {
      const hit = await scrollFind([lab], (i) => i.top > 100, 3)
      if (!hit) continue
      await touch(hit.x, hit.y)
      await sleep(1100)
      await capture('Settings-' + lab.replace(/\W+/g, '_'))
      await back()
      await sleep(650)
    }
  },
})
await visit('HelpSupport', [L.help], { tab: L.account })
await visit('About', [L.about], { tab: L.account, pred: (i) => i.top > 200 })

// --- DRAWER DEPTH ---
{
  let u = await openDrawer()
  await shot('Drawer')
  const near = find(u, [L.nearMe], (i) => i.l < 260 && i.top > 140)
  if (near) {
    await touch(near.x, near.y)
    await sleep(2200)
    await capture('Drawer-NearMe')
    if ((await ui()).leaflet) {
      await swipe(200, 620, 260)
      await sleep(750)
      await shot('Drawer-NearMe-sheet')
    }
  } else {
    report.failed.push('Drawer-NearMe')
    log('FAIL Drawer-NearMe')
  }
}
{
  let u = await openDrawer()
  const offers = find(u, [L.offers], (i) => i.l < 260)
  if (offers) {
    await touch(offers.x, offers.y)
    await sleep(2200)
    await capture('Drawer-Offers')
    const deal = (await ui()).items.find(
      (i) => /%|OFF|Deal|Special/i.test(i.t) && i.top > 150 && i.top < 550
    )
    if (deal) {
      await touch(deal.x, deal.y)
      await sleep(1300)
      await capture('Drawer-OfferDetail')
      await back()
      await sleep(700)
    }
  } else {
    report.failed.push('Drawer-Offers')
  }
}
{
  let u = await openDrawer()
  const w = find(u, [L.wallet], (i) => i.l < 260 && i.top > 300)
  if (w) {
    await touch(w.x, w.y)
    await sleep(1500)
    await capture('Drawer-Wallet')
  }
}
{
  let u = await openDrawer()
  const s = find(u, [L.settings], (i) => i.l < 260 && i.top > 400)
  if (s) {
    await touch(s.x, s.y)
    await sleep(1500)
    await capture('Drawer-Settings')
  }
}

await tapTab(L.home)
await sleep(500)
await capture('Final-Home')

// duplicate top detection
const tops = Object.entries(report.hashes).filter(([k]) => k.endsWith('-top'))
const byH = {}
for (const [k, h] of tops) (byH[h] ||= []).push(k)
report.duplicateTops = Object.values(byH).filter((g) => g.length > 1)

const summary = {
  ...report,
  counts: {
    visited: report.visited.length,
    failed: report.failed.length,
    shots: report.shots.length,
    duplicateTopGroups: report.duplicateTops.length,
  },
  at: new Date().toISOString(),
  out: OUT,
}
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(summary, null, 2))
log('\n===== DEEP CRAWL DONE =====')
log(JSON.stringify(summary.counts))
log('visited:', report.visited.join(', '))
log('failed:', report.failed.join(', '))
if (report.duplicateTops.length) {
  log('duplicate tops:')
  for (const g of report.duplicateTops) log(' ', g.join(' == '))
}
ws.close()
process.exit(0)
