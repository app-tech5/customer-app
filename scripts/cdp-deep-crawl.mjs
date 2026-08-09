#!/usr/bin/env node
/**
 * Deep crawl driven by customer-app navigation source (Stacks / Drawer / root).
 * Requires web bridge: window.__GF_CRAWL__ (navigation/rootNavigationRef.js).
 *
 * Does NOT guess UI labels. Uses navigate(path) with real screen names.
 */
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'

const require = createRequire(import.meta.url)
const WebSocket = require('/Users/nass/Documents/admin-app/node_modules/ws')

const OUT =
  process.env.DEEP_OUT ||
  '/Users/nass/Documents/good-foods-description/img/pro/visuals/out/qa-web/deep'
fs.mkdirSync(OUT, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const log = (...a) => console.log(...a)

/**
 * Route catalog from navigation/Stacks.js + DrawerNavigator.js + navigation.js
 * Paths are from root NavigationContainer (signed-in).
 */
const ROUTES = {
  // Tabs → stack roots
  Home: ['DrawerNavigator', 'BottomTabs', 'Home', 'HomeScreen'],
  Search: ['DrawerNavigator', 'BottomTabs', 'Search', 'SearchScreen'],
  Cart: ['DrawerNavigator', 'BottomTabs', 'Cart', 'Carts'],
  Orders: ['DrawerNavigator', 'BottomTabs', 'Orders', 'Orders'],
  Account: ['DrawerNavigator', 'BottomTabs', 'Account', 'AccountScreen'],

  // Home stack depth
  RestaurantsMap: ['DrawerNavigator', 'BottomTabs', 'Home', 'RestaurantsMapScreen'],

  // Account stack depth (AccountNavigator)
  EditProfile: ['DrawerNavigator', 'BottomTabs', 'Account', 'EditProfile'],
  Favorites: ['DrawerNavigator', 'BottomTabs', 'Account', 'Favorites'],
  Addresses: ['DrawerNavigator', 'BottomTabs', 'Account', 'AddressesScreen'],
  Settings: ['DrawerNavigator', 'BottomTabs', 'Account', 'Settings'],
  HelpSupport: ['DrawerNavigator', 'BottomTabs', 'Account', 'HelpSupport'],
  Subscriptions: ['DrawerNavigator', 'BottomTabs', 'Account', 'Subscriptions'],
  About: ['DrawerNavigator', 'BottomTabs', 'Account', 'About'],

  // Drawer screens (DrawerNavigator.js)
  DrawerNearMe: ['DrawerNavigator', 'NearMe'],
  DrawerOffers: ['DrawerNavigator', 'Offers'],
  DrawerWallet: ['DrawerNavigator', 'Wallet', 'Wallet'],
  DrawerSettings: ['DrawerNavigator', 'Settings', 'SettingsScreen'],
  DrawerSettingsHelp: ['DrawerNavigator', 'Settings', 'HelpSupport'],
  DrawerSettingsAbout: ['DrawerNavigator', 'Settings', 'About'],
  DrawerSettingsEditProfile: ['DrawerNavigator', 'Settings', 'EditProfile'],

  // Wallet section depth
  AddMoney: ['DrawerNavigator', 'Wallet', 'AddMoney'],
  AddPaymentMethod: ['DrawerNavigator', 'Wallet', 'AddPaymentMethod'],
  AddCard: ['DrawerNavigator', 'Wallet', 'AddCard'],

  // Root-level flows (navigation.js)
  WalletFlow: ['WalletFlow', 'Wallet'],
  WalletFlowAddMoney: ['WalletFlow', 'AddMoney'],
  CheckoutFlow: ['CheckoutFlow', 'CheckoutScreen'],
}

const report = {
  visited: [],
  failed: [],
  skipped: [],
  shots: [],
  hashes: {},
}

async function pickTab() {
  const pages = await (await fetch('http://127.0.0.1:9222/json/list')).json()
  const demos = pages.filter(
    (p) => p.type === 'page' && (p.url || '').includes('demo/customer')
  )
  return demos.reverse()[0] || null
}

const page = await pickTab()
if (!page) throw new Error('No demo Chrome tab')
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
const c = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = n++
    const t = setTimeout(() => {
      pending.delete(id)
      reject(new Error('timeout ' + method))
    }, 20000)
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
    ws.send(JSON.stringify({ id, method, params }))
  })

await c('Page.enable')
await c('Runtime.enable')
try {
  await c('Page.bringToFront')
} catch {}

const swipe = async (x, y1, y2) => {
  await c('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y: y1, id: 0 }],
  })
  for (let i = 1; i <= 10; i++) {
    await c('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y1 + ((y2 - y1) * i) / 10, id: 0 }],
    })
    await sleep(12)
  }
  await c('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

let shotIdx = 0
const shot = async (label) => {
  shotIdx++
  const name =
    String(shotIdx).padStart(3, '0') +
    '-' +
    label.replace(/[^\w.-]+/g, '_').slice(0, 70)
  const s = await c('Page.captureScreenshot', {
    format: 'jpeg',
    quality: 48,
    fromSurface: true,
  })
  const buf = Buffer.from(s.data, 'base64')
  fs.writeFileSync(path.join(OUT, name + '.jpg'), buf)
  const hash = createHash('md5').update(buf).digest('hex').slice(0, 10)
  report.shots.push(name)
  report.hashes[name] = hash
  log('SHOT', name, hash)
  return { name, hash }
}

const evalJson = async (expression) =>
  (
    await c('Runtime.evaluate', {
      returnByValue: true,
      expression,
    })
  ).result.value

const crawlReady = async () =>
  evalJson(`!!(window.__GF_CRAWL__ && window.__GF_CRAWL__.ready && window.__GF_CRAWL__.ready())`)

const nav = async (path, leafParams) =>
  evalJson(`window.__GF_CRAWL__.navigate(${JSON.stringify(path)}, ${JSON.stringify(leafParams ?? null)})`)

const routeState = async () =>
  evalJson(`(()=>{
    const s = window.__GF_CRAWL__ && window.__GF_CRAWL__.getState && window.__GF_CRAWL__.getState();
    if(!s) return null;
    const names=[];
    (function walk(st, depth){
      if(!st||!st.routes) return;
      const r=st.routes[st.index||0];
      if(!r) return;
      names.push(r.name);
      if(r.state) walk(r.state, depth+1);
    })(s,0);
    return names;
  })()`)

const capture = async (id) => {
  const a = await shot(id + '-top')
  await swipe(200, 540, 200)
  await sleep(350)
  const b = await shot(id + '-bot')
  report.visited.push(id)
  // detect identical top/bot as possible scroll bug (same hash)
  if (a.hash === b.hash) {
    log('NOTE', id, 'top===bot hash (no scroll change or short page)')
  }
  return a
}

const go = async (id, path, leafParams, { settleMs = 1200 } = {}) => {
  log('NAV', id, path.join(' → '), leafParams ? '(params)' : '')
  const res = await nav(path, leafParams)
  if (!res?.ok) {
    log('FAIL nav', id, res)
    report.failed.push(id + ':' + (res?.reason || 'nav'))
    return false
  }
  await sleep(settleMs)
  const stack = await routeState()
  log('STACK', stack?.join(' / '))
  await capture(id)
  return true
}

// ----- boot: need published build with bridge; soft-reload current demo -----
log('Checking bridge on current page...')
let ready = false
try {
  ready = await crawlReady()
} catch (e) {
  log('bridge check error', e.message)
}

if (!ready) {
  log('No __GF_CRAWL__ — reloading demo URL (needs published bridge)')
  try {
    await c('Page.navigate', {
      url: 'https://good-foods.digitaldienste.fr/demo/customer/?navbridge=' + Date.now(),
    })
  } catch (e) {
    log('navigate err', e.message)
  }
  await sleep(10000)
  for (let i = 0; i < 10; i++) {
    try {
      ready = await crawlReady()
    } catch {
      ready = false
    }
    log('bridge wait', i, ready)
    if (ready) break
    await sleep(2000)
  }
}

if (!ready) {
  const msg =
    'ABORT: window.__GF_CRAWL__ missing. Publish customer-app with rootNavigationRef bridge first.'
  log(msg)
  fs.writeFileSync(
    path.join(OUT, 'report.json'),
    JSON.stringify({ error: msg, needPublish: true }, null, 2)
  )
  ws.close()
  process.exit(2)
}

log('Bridge OK')

// 1) Tab roots
for (const id of ['Home', 'Search', 'Cart', 'Orders', 'Account']) {
  await go(id, ROUTES[id])
}

// 2) Account stack depth
for (const id of [
  'EditProfile',
  'Favorites',
  'Addresses',
  'Settings',
  'HelpSupport',
  'Subscriptions',
  'About',
]) {
  await go(id, ROUTES[id])
}

// 3) Drawer
await go('DrawerNearMe', ROUTES.DrawerNearMe, null, { settleMs: 2200 })
await go('DrawerOffers', ROUTES.DrawerOffers, null, { settleMs: 2200 })
await go('DrawerWallet', ROUTES.DrawerWallet)
await go('AddMoney', ROUTES.AddMoney)
await go('AddPaymentMethod', ROUTES.AddPaymentMethod)
await go('AddCard', ROUTES.AddCard)
await go('DrawerSettings', ROUTES.DrawerSettings)
await go('DrawerSettingsEditProfile', ROUTES.DrawerSettingsEditProfile)
await go('DrawerSettingsHelp', ROUTES.DrawerSettingsHelp)
await go('DrawerSettingsAbout', ROUTES.DrawerSettingsAbout)

// 4) Map via Home stack
await go('RestaurantsMap', ROUTES.RestaurantsMap, null, { settleMs: 2200 })

// 5) RestaurantDetail + MenuDetail using live restaurant from bridge
{
  const restaurants = await evalJson(
    `(window.__GF_CRAWL__.getRestaurants && window.__GF_CRAWL__.getRestaurants()) || []`
  )
  log('restaurants', Array.isArray(restaurants) ? restaurants.length : 0)
  const restaurant = Array.isArray(restaurants) ? restaurants[0] : null
  if (!restaurant) {
    report.skipped.push('RestaurantDetail (no __GF_RESTAURANTS__)')
  } else {
    await go(
      'RestaurantDetail',
      ['DrawerNavigator', 'BottomTabs', 'Home', 'RestaurantDetail'],
      { restaurant },
      { settleMs: 2200 }
    )
    // try open menu if foods exist on restaurant object
    const menuItem =
      restaurant.foods?.[0] ||
      restaurant.menus?.[0] ||
      restaurant.menu?.[0] ||
      null
    if (menuItem) {
      await go(
        'MenuDetail',
        ['DrawerNavigator', 'BottomTabs', 'Home', 'MenuDetailScreen'],
        { food: menuItem, restaurant },
        { settleMs: 1600 }
      )
    } else {
      report.skipped.push('MenuDetail (no menu item on restaurant[0])')
    }
  }
}

// 6) SearchResults with query param if screen accepts it
await go('Search', ROUTES.Search)
await go(
  'SearchResults',
  ['DrawerNavigator', 'BottomTabs', 'Search', 'SearchResults'],
  { searchQuery: 'pizza', query: 'pizza' },
  { settleMs: 1600 }
)

// 7) Orders depth if we have an order
{
  const orders = await evalJson(
    `(window.__GF_CRAWL__.getOrders && window.__GF_CRAWL__.getOrders()) || []`
  )
  const order = Array.isArray(orders) && orders[0]
  if (order) {
    await go(
      'OrderDetails',
      ['DrawerNavigator', 'BottomTabs', 'Orders', 'OrderDetails'],
      { order },
      { settleMs: 1600 }
    )
    await go(
      'OrderTracking',
      ['DrawerNavigator', 'BottomTabs', 'Orders', 'OrderTracking'],
      { order },
      { settleMs: 1600 }
    )
    await go(
      'OrderChat',
      ['DrawerNavigator', 'BottomTabs', 'Orders', 'OrderChat'],
      { order },
      { settleMs: 1600 }
    )
  } else {
    report.skipped.push('OrderDetails/Tracking/Chat (no orders in bridge)')
  }
}

// 8) Checkout flow (may be empty)
await go('CheckoutFlow', ROUTES.CheckoutFlow)
await go('WalletFlow', ROUTES.WalletFlow)

await go('FinalHome', ROUTES.Home)

// Detect duplicate hashes across different screen ids (stuck UI)
{
  const byHash = {}
  for (const [name, hash] of Object.entries(report.hashes)) {
    if (!name.endsWith('-top')) continue
    ;(byHash[hash] ||= []).push(name)
  }
  report.duplicateTops = Object.values(byHash).filter((g) => g.length > 1)
  if (report.duplicateTops.length) {
    log('WARN duplicate top screenshots (possible stuck nav):')
    for (const g of report.duplicateTops) log(' ', g.join(' == '))
  }
}

const summary = {
  ...report,
  counts: {
    visited: report.visited.length,
    failed: report.failed.length,
    skipped: report.skipped.length,
    shots: report.shots.length,
    duplicateTopGroups: report.duplicateTops?.length || 0,
  },
  at: new Date().toISOString(),
  out: OUT,
}
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(summary, null, 2))
log('\n===== SOURCE-DRIVEN CRAWL DONE =====')
log(JSON.stringify(summary.counts))
log('visited', report.visited.join(', '))
log('failed', report.failed.join(', '))
log('skipped', report.skipped.join(', '))
ws.close()
process.exit(report.failed.length ? 1 : 0)
