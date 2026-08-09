#!/usr/bin/env node
/**
 * Chrome CDP full UI crawl over ADB (9222).
 * Navigates tabs + account rows + drawer, hardens scroll, screenshots, reports issues.
 */
import WebSocket from 'ws'
import fs from 'fs'
import path from 'path'

const OUT = process.env.GF_CRAWL_OUT ||
  '/Users/nass/Documents/good-foods-description/img/pro/visuals/out/qa-web/crawl/full'
const PAGE_ID = process.env.GF_CDP_PAGE_ID || ''
const BASE = 'https://good-foods.digitaldienste.fr/demo/customer/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

fs.mkdirSync(OUT, { recursive: true })

async function main() {
  const list = await (await fetch('http://127.0.0.1:9222/json/list')).json()
  const page =
    (PAGE_ID && list.find((p) => p.id === PAGE_ID)) ||
    list.find((p) => p.type === 'page' && /fullcrawl|demo\/customer/.test(p.url || ''))
  if (!page) throw new Error('No demo Chrome page on :9222')
  console.log('page', page.id, page.url)

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
  const c = (method, params = {}, timeout = 25000) =>
    new Promise((resolve, reject) => {
      const id = n++
      const t = setTimeout(() => {
        pending.delete(id)
        reject(new Error(`${method} timeout`))
      }, timeout)
      pending.set(id, {
        resolve: (r) => {
          clearTimeout(t)
          resolve(r)
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
  await c('Page.navigate', { url: `${BASE}?fullcrawl=${Date.now()}` })
  await sleep(4500)

  const dim = (
    await c('Runtime.evaluate', {
      returnByValue: true,
      expression: `({w:innerWidth,h:innerHeight})`,
    })
  ).result.value

  async function tap(x, y) {
    await c('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x,
      y,
      button: 'left',
      clickCount: 1,
    })
    await c('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x,
      y,
      button: 'left',
      clickCount: 1,
    })
  }

  async function shot(name) {
    const s = await c('Page.captureScreenshot', { format: 'jpeg', quality: 52 })
    const file = path.join(OUT, `${name}.jpg`)
    fs.writeFileSync(file, Buffer.from(s.data, 'base64'))
    return file
  }

  async function hardenScroll() {
    return (
      await c('Runtime.evaluate', {
        returnByValue: true,
        expression: `(()=>{
      let n=0; const vh=innerHeight||0; const vw=innerWidth||0;
      for(const el of document.querySelectorAll('div')){
        if(el.querySelector('iframe,canvas,.leaflet-container')) continue;
        const st=getComputedStyle(el);
        if(st.overflowX==='auto'||st.overflowX==='scroll') continue;
        const taller=el.scrollHeight>el.clientHeight+40;
        const viewportish=el.clientHeight>160 && el.clientHeight<=vh+40;
        if(taller && viewportish && /hidden|auto|scroll/.test(st.overflowY)|| (taller&&viewportish&&st.overflow==='hidden')){
          el.style.setProperty('overflow-y','scroll','important');
          el.style.setProperty('touch-action','pan-y','important');
          el.style.setProperty('-webkit-overflow-scrolling','touch','important');
          el.style.setProperty('min-height','0','important');
          el.dataset.gfScrollOk='1'; n++;
        }
      }
      for(const el of document.querySelectorAll('div')){
        const st=getComputedStyle(el);
        if(st.position!=='absolute'&&st.position!=='fixed') continue;
        const r=el.getBoundingClientRect();
        if(r.width<200||r.width>320||r.height<vh*0.6) continue;
        if(r.right<=0||r.left>=vw) el.style.setProperty('pointer-events','none','important');
        else if(r.left>=0 && r.left<80) el.style.removeProperty('pointer-events');
      }
      return n;
    })()`,
      })
    ).result.value
  }

  async function analyze(tag) {
    return (
      await c('Runtime.evaluate', {
        returnByValue: true,
        expression: `(()=>{
      const tag=${JSON.stringify(tag)};
      const texts=[...document.querySelectorAll('div,span,h1,h2,p,button')].map(e=>(e.innerText||'').trim()).filter(t=>t&&t.length<48);
      const uniq=[...new Set(texts)].slice(0,40);
      const titleCandidates=uniq.filter(t=>/^[A-Z][A-Za-z ].{0,30}$/.test(t)).slice(0,8);
      const scrollports=[...document.querySelectorAll('div')].filter(el=>{
        return el.scrollHeight>el.clientHeight+40 && el.clientHeight>160;
      }).map(el=>{
        const st=getComputedStyle(el);
        return {oy:st.overflowY, sh:el.scrollHeight, ch:el.clientHeight, st:el.scrollTop, ta:st.touchAction, ok:el.dataset.gfScrollOk==='1'};
      }).slice(0,6);
      const blocked=scrollports.filter(s=>s.oy==='hidden').length;
      const canScroll=scrollports.some(s=>/auto|scroll/.test(s.oy));
      const imgs=[...document.querySelectorAll('img')].filter(i=>i.naturalWidth===0 && i.width>20).length;
      const bodyText=(document.body&&document.body.innerText||'').replace(/\\s+/g,' ').trim();
      const blank=bodyText.length<40;
      const hasLoader=/Preparing your experience|Loading delicious/i.test(bodyText);
      const hasError=/Unable to load|Something went wrong|Error|Retry/i.test(bodyText);
      const logoLoader=/logo512/.test([...document.querySelectorAll('img')].map(i=>i.src).join(' ')) && hasLoader;
      const clipped = scrollports.some(s=>s.sh>s.ch+80) && (!canScroll || blocked>0);
      const best=scrollports.slice().sort((a,b)=>(b.sh-b.ch)-(a.sh-a.ch))[0];
      return {
        tag,
        titleCandidates,
        labels: uniq.filter(t=>/Home|Search|Cart|Order|Account|Wallet|Settings|Balance|Map|Near|Favorite|Address|Help|About|Subscription|Payment|Language|Logout|Profile/i.test(t)).slice(0,25),
        scrollports: scrollports.slice(0,4),
        blocked, canScroll, clipped, blank, hasLoader, hasError, logoLoader, brokenImgs: imgs,
        bestScrollDelta: best ? best.sh-best.ch : 0,
        textLen: bodyText.length,
      };
    })()`,
      })
    ).result.value
  }

  async function touchSwipe() {
    const x = Math.round(dim.w / 2)
    await c('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y: Math.round(dim.h * 0.7) }],
    })
    for (let y = Math.round(dim.h * 0.7); y >= Math.round(dim.h * 0.25); y -= 28) {
      await c('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] })
      await sleep(12)
    }
    await c('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await sleep(350)
  }

  async function scrollMax() {
    await c('Runtime.evaluate', {
      expression: `(()=>{
      const els=[...document.querySelectorAll('div')].filter(e=>e.scrollHeight>e.clientHeight+40);
      els.sort((a,b)=>(b.scrollHeight-b.clientHeight)-(a.scrollHeight-a.clientHeight));
      if(els[0]) els[0].scrollTop = els[0].scrollHeight;
    })()`,
    })
    await sleep(300)
  }

  async function clickVisibleText(label, { partial = false } = {}) {
    const hit = (
      await c('Runtime.evaluate', {
        returnByValue: true,
        expression: `(()=>{
      const label=${JSON.stringify(label)};
      const partial=${partial ? 'true' : 'false'};
      let best=null;
      for(const el of document.querySelectorAll('div,span,a,button,p')){
        const t=(el.innerText||'').trim();
        if(!t) continue;
        if(partial ? !(t===label || t.startsWith(label+"\\n") || t.startsWith(label+" ")) : t!==label) continue;
        if(!partial && t.length>60) continue;
        const r=el.getBoundingClientRect();
        if(r.width<8||r.height<8) continue;
        if(r.top<56||r.top>innerHeight-56) continue;
        // ignore off-screen drawer (-280)
        if(r.left<8||r.left>=innerWidth-8) continue;
        const score = (partial ? -Math.min(t.length,80) : 0) + r.width + (r.left>40?50:0);
        if(!best || score>best.score) best={x:r.x+r.width/2,y:r.y+Math.min(28,r.height/2),t:t.slice(0,50),score,left:r.left};
      }
      return best;
    })()`,
      })
    ).result.value
    if (!hit) return null
    await tap(hit.x, hit.y)
    await sleep(1400)
    return hit
  }

  async function headerTitle() {
    return (
      await c('Runtime.evaluate', {
        returnByValue: true,
        expression: `(()=>{
      // RN header title is usually near top center
      const nodes=[...document.querySelectorAll('div,span,h1,h2')];
      let best=null;
      for(const el of nodes){
        const t=(el.innerText||'').trim();
        if(!t||t.length>40||t.includes('\\n')) continue;
        const r=el.getBoundingClientRect();
        if(r.top<8||r.top>90||r.height>40||r.width<40) continue;
        if(r.left<60) continue; // skip back/menu
        const dist=Math.abs((r.left+r.width/2)-innerWidth/2);
        if(!best||dist<best.dist) best={t,dist};
      }
      return best&&best.t;
    })()`,
      })
    ).result.value
  }

  async function tapTab(index /* 0..4 */) {
    const labels = ['Home', 'Search', 'Cart', 'Order History', 'My Account']
    const label = labels[index]
    // Prefer clicking the tab label text in the bottom bar
    const hit = (
      await c('Runtime.evaluate', {
        returnByValue: true,
        expression: `(()=>{
      const label=${JSON.stringify(label)};
      let best=null;
      for(const el of document.querySelectorAll('div,span')){
        const t=(el.innerText||'').trim();
        if(t!==label) continue;
        const r=el.getBoundingClientRect();
        if(r.top<innerHeight-90||r.height>40||r.left<0) continue;
        best={x:r.x+r.width/2,y:r.y+r.height/2};
      }
      return best;
    })()`,
      })
    ).result.value
    if (hit) await tap(hit.x, hit.y)
    else {
      const x = Math.round((dim.w / 5) * (index + 0.5))
      await tap(x, dim.h - 28)
    }
    await sleep(1500)
  }

  async function openDrawer() {
    await tap(28, 56)
    await sleep(700)
  }

  async function goBack() {
    await c('Runtime.evaluate', { expression: `history.back();true` })
    await sleep(900)
  }

  const report = { pageId: page.id, dim, startedAt: new Date().toISOString(), screens: [] }

  async function visit(name, fn) {
    console.log('→', name)
    try {
      await fn()
      await hardenScroll()
      const title = await headerTitle()
      const before = await analyze(name)
      await shot(`01-${name}`)
      const topsBefore = (
        await c('Runtime.evaluate', {
          returnByValue: true,
          expression: `(()=>[...document.querySelectorAll('div')].filter(e=>e.scrollHeight>e.clientHeight+40).map(e=>e.scrollTop).slice(0,8))`,
        })
      ).result.value
      await touchSwipe()
      const topsAfter = (
        await c('Runtime.evaluate', {
          returnByValue: true,
          expression: `(()=>[...document.querySelectorAll('div')].filter(e=>e.scrollHeight>e.clientHeight+40).map(e=>e.scrollTop).slice(0,8))`,
        })
      ).result.value
      const beforeArr = Array.isArray(topsBefore) ? topsBefore : []
      const afterArr = Array.isArray(topsAfter) ? topsAfter : []
      const touchMoved = afterArr.some((v, i) => Number(v) - Number(beforeArr[i] || 0) > 20)
      await scrollMax()
      await shot(`02-${name}-scrolled`)
      const issues = []
      if (before.blank) issues.push('blank')
      if (before.hasLoader) issues.push('stuck_loader')
      if (before.logoLoader) issues.push('logo_loader')
      if (before.hasError) issues.push('error_ui')
      if (before.clipped) issues.push('clipped_no_scroll')
      if (before.blocked > 0) issues.push('overflow_hidden_clip')
      if (before.bestScrollDelta > 120 && !touchMoved) issues.push('touch_scroll_failed')
      if (before.brokenImgs > 0) issues.push(`broken_imgs:${before.brokenImgs}`)
      const entry = {
        name,
        headerTitle: title,
        issues,
        labels: before.labels,
        titles: before.titleCandidates,
        scroll: before.scrollports,
        touchMoved,
        touchScrollTops: afterArr,
        bestScrollDelta: before.bestScrollDelta,
      }
      report.screens.push(entry)
      console.log('  issues', issues.join(',') || 'none', 'delta', before.bestScrollDelta)
    } catch (e) {
      report.screens.push({ name, issues: ['crawl_error:' + e.message] })
      console.log('  ERR', e.message)
    }
  }

  // Tabs
  await visit('tab-home', async () => {
    await tapTab(0)
  })
  await visit('tab-search', async () => {
    await tapTab(1)
  })
  await visit('tab-cart', async () => {
    await tapTab(2)
  })
  await visit('tab-orders', async () => {
    await tapTab(3)
  })
  await visit('tab-account', async () => {
    await tapTab(4)
  })

  // Account children
  const accountRows = [
    'Edit Profile',
    'Favorites',
    'Wallet',
    'Subscription',
    'Addresses',
    'Settings',
    'Help & Support',
    'About',
  ]
  for (const row of accountRows) {
    await visit(`account-${row.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, async () => {
      await tapTab(4)
      await hardenScroll()
      await scrollMax()
      // some labels differ
      let hit = await clickVisibleText(row)
      if (!hit && row === 'Help & Support') hit = await clickVisibleText('Help', { partial: true })
      if (!hit && row === 'Subscription') hit = await clickVisibleText('Subscription', { partial: true })
      if (!hit && row === 'Edit Profile') hit = await clickVisibleText('Edit Profile', { partial: true })
      if (!hit) {
        // scroll mid then retry
        await c('Runtime.evaluate', {
          expression: `(()=>{const el=[...document.querySelectorAll('div')].filter(e=>e.scrollHeight>e.clientHeight+40).sort((a,b)=>(b.scrollHeight-b.clientHeight)-(a.scrollHeight-a.clientHeight))[0]; if(el) el.scrollTop=Math.min(el.scrollHeight,500);})()`,
        })
        await sleep(300)
        hit = await clickVisibleText(row, { partial: true })
      }
      if (!hit) throw new Error('row_not_found:' + row)
    })
    await goBack()
  }

  // Home → map / near me / restaurant
  await visit('home-near-me', async () => {
    await tapTab(0)
    await hardenScroll()
    const hit = (await clickVisibleText('Near me', { partial: true })) ||
      (await clickVisibleText('Near Me', { partial: true }))
    if (!hit) {
      // try map icon top-right-ish
      await tap(dim.w - 40, 100)
      await sleep(1200)
    }
  })
  await goBack()

  await visit('home-restaurant-card', async () => {
    await tapTab(0)
    await hardenScroll()
    // tap first restaurant-ish card mid screen
    await tap(dim.w / 2, dim.h * 0.55)
    await sleep(1800)
  })

  await visit('drawer-settings', async () => {
    await tapTab(4)
    await openDrawer()
    // force drawer visible
    await c('Runtime.evaluate', {
      expression: `(()=>{
      for(const el of document.querySelectorAll('div')){
        const st=getComputedStyle(el); const r=el.getBoundingClientRect();
        if((st.position==='absolute'||st.position==='fixed') && r.width>200&&r.width<320&&r.height>400){
          el.style.transform='translateX(0)'; el.style.left='0px'; el.style.pointerEvents='auto';
        }
      }
    })()`,
    })
    await sleep(400)
    const hit = await clickVisibleText('Settings')
    if (!hit) throw new Error('drawer settings missing')
  })

  await visit('drawer-wallet', async () => {
    await tapTab(4)
    await openDrawer()
    await c('Runtime.evaluate', {
      expression: `(()=>{
      for(const el of document.querySelectorAll('div')){
        const st=getComputedStyle(el); const r=el.getBoundingClientRect();
        if((st.position==='absolute'||st.position==='fixed') && r.width>200&&r.width<320&&r.height>400){
          el.style.transform='translateX(0)'; el.style.left='0px'; el.style.pointerEvents='auto';
        }
      }
    })()`,
    })
    await sleep(400)
    const hit = await clickVisibleText('Wallet')
    if (!hit) throw new Error('drawer wallet missing')
  })

  report.finishedAt = new Date().toISOString()
  report.issueCount = report.screens.reduce((n, s) => n + (s.issues?.length || 0), 0)
  report.byIssue = {}
  for (const s of report.screens) {
    for (const i of s.issues || []) {
      report.byIssue[i] = (report.byIssue[i] || 0) + 1
    }
  }
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(report, null, 2))
  console.log('\nDONE screens', report.screens.length, 'issues', report.issueCount)
  console.log(JSON.stringify(report.byIssue, null, 2))
  ws.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
