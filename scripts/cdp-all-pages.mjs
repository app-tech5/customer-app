#!/usr/bin/env node
/**
 * Exhaustive Chrome CDP crawl: open every screen, scroll to bottom, screenshot top+bottom.
 */
import WebSocket from 'ws'
import fs from 'fs'
import path from 'path'

const OUT =
  process.env.GF_CRAWL_OUT ||
  '/Users/nass/Documents/good-foods-description/img/pro/visuals/out/qa-web/crawl/all'
const PAGE_ID = process.env.GF_CDP_PAGE_ID || ''
const BASE = 'https://good-foods.digitaldienste.fr/demo/customer/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

fs.mkdirSync(OUT, { recursive: true })

async function main() {
  const list = await (await fetch('http://127.0.0.1:9222/json/list')).json()
  const page =
    (PAGE_ID && list.find((p) => p.id === PAGE_ID)) ||
    list.find((p) => p.type === 'page' && /allpages|demo\/customer/.test(p.url || ''))
  if (!page) throw new Error('No demo page')
  console.log('CDP page', page.id, page.url)

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
  const c = (method, params = {}, timeout = 30000) =>
    new Promise((resolve, reject) => {
      const id = n++
      const t = setTimeout(() => {
        pending.delete(id)
        reject(new Error(`${method} timeout`))
      }, timeout)
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
  await c('Page.navigate', { url: `${BASE}?allpages=${Date.now()}` })
  await sleep(5000)

  const dim = (
    await c('Runtime.evaluate', {
      returnByValue: true,
      expression: `({w:innerWidth,h:innerHeight,fix:!!window.__GF_WEB_SCROLL_FIX__})`,
    })
  ).result.value
  console.log('dim', dim)

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
    const s = await c('Page.captureScreenshot', { format: 'jpeg', quality: 48 })
    const file = path.join(OUT, `${name}.jpg`)
    fs.writeFileSync(file, Buffer.from(s.data, 'base64'))
    return { file, bytes: fs.statSync(file).size }
  }

  async function harden() {
    return (
      await c('Runtime.evaluate', {
        returnByValue: true,
        expression: `(()=>{
      let n=0; const vh=innerHeight||0; const vw=innerWidth||0;
      for(const el of document.querySelectorAll('div')){
        if(el.querySelector('iframe,canvas,.leaflet-container')) continue;
        const r=el.getBoundingClientRect();
        // never touch drawer-sized panels
        if(r.width>=200&&r.width<=340&&r.height>=vh*0.55) continue;
        const st=getComputedStyle(el);
        if(st.overflowX==='auto'||st.overflowX==='scroll') continue;
        const taller=el.scrollHeight>el.clientHeight+40;
        const viewportish=el.clientHeight>180 && el.clientHeight<=vh+40;
        if(taller && viewportish && (st.overflowY==='hidden'||st.overflow==='hidden')){
          el.style.setProperty('overflow-y','auto','important');
          el.style.setProperty('touch-action','pan-y','important');
          el.style.setProperty('min-height','0','important');
          el.dataset.gfScrollOk='1'; n++;
        }
      }
      for(const el of document.querySelectorAll('div')){
        const st=getComputedStyle(el);
        if(st.position!=='absolute'&&st.position!=='fixed') continue;
        const r=el.getBoundingClientRect();
        if(r.width>200&&r.width<320&&r.height>vh*0.55&&(r.right<=0||r.left>=vw)){
          el.style.setProperty('pointer-events','none','important');
        }
      }
      return n;
    })()`,
      })
    ).result.value
  }

  async function closeDrawer() {
    await c('Runtime.evaluate', {
      expression: `(()=>{
      const vw=innerWidth||0; const vh=innerHeight||0;
      for(const el of document.querySelectorAll('div')){
        const st=getComputedStyle(el); const r=el.getBoundingClientRect();
        if((st.position==='absolute'||st.position==='fixed') && r.width>200&&r.width<320&&r.height>vh*0.55 && r.left>=0 && r.left<80){
          el.style.transform='translateX(-'+Math.ceil(r.width)+'px)';
          el.style.pointerEvents='none';
        }
      }
      // tap scrim / right side
    })()`,
    })
    await tap(Math.round(dim.w * 0.85), Math.round(dim.h * 0.5))
    await sleep(400)
  }

  async function mainScrollports() {
    return (
      await c('Runtime.evaluate', {
        returnByValue: true,
        expression: `(()=>[...document.querySelectorAll('div')]
      .filter(e=>e.scrollHeight>e.clientHeight+40 && e.clientHeight>140)
      .map(e=>({st:e.scrollTop,sh:e.scrollHeight,ch:e.clientHeight,d:e.scrollHeight-e.clientHeight,oy:getComputedStyle(e).overflowY,ok:e.dataset.gfScrollOk==='1'}))
      .sort((a,b)=>b.d-a.d).slice(0,5))`,
      })
    ).result.value
  }

  async function scrollToBottom() {
    // stepwise: reset, then jump to end on every tall scrollport
    await c('Runtime.evaluate', {
      expression: `(()=>{
      for(const el of document.querySelectorAll('div')){
        if(el.scrollHeight>el.clientHeight+40) el.scrollTop=0;
      }
    })()`,
    })
    await sleep(200)
    for (let step = 0; step < 8; step++) {
      await c('Runtime.evaluate', {
        expression: `(()=>{
        const els=[...document.querySelectorAll('div')].filter(e=>e.scrollHeight>e.clientHeight+40);
        for(const el of els){
          el.scrollTop = Math.min(el.scrollHeight, el.scrollTop + Math.max(220, el.clientHeight*0.85));
        }
      })()`,
      })
      await sleep(180)
    }
    await c('Runtime.evaluate', {
      expression: `(()=>{
      const els=[...document.querySelectorAll('div')].filter(e=>e.scrollHeight>e.clientHeight+40);
      for(const el of els) el.scrollTop = el.scrollHeight;
    })()`,
    })
    await sleep(350)
  }

  async function visibleExact(label) {
    return (
      await c('Runtime.evaluate', {
        returnByValue: true,
        expression: `(()=>{
      const label=${JSON.stringify(label)};
      let best=null;
      for(const el of document.querySelectorAll('div,span,button,a,p')){
        const t=(el.innerText||'').trim();
        if(t!==label && !t.startsWith(label+'\\n')) continue;
        const r=el.getBoundingClientRect();
        if(r.width<8||r.height<8) continue;
        if(r.top<50||r.top>innerHeight-55) continue;
        if(r.left<8||r.left>innerWidth-8) continue;
        const score=r.width+(r.left>50?80:0)-Math.min(t.length,100);
        if(!best||score>best.score) best={x:r.x+r.width/2,y:r.y+Math.min(24,r.height/2),t:t.slice(0,40),score,top:r.top,left:r.left};
      }
      return best;
    })()`,
      })
    ).result.value
  }

  async function clickLabel(label) {
    const hit = await visibleExact(label)
    if (!hit) return null
    await tap(hit.x, hit.y)
    await sleep(1500)
    return hit
  }

  async function tapTab(label) {
    await closeDrawer().catch(() => {})
    const map = { Home: 0, Search: 1, Cart: 2, 'Order History': 3, 'My Account': 4 }
    const i = map[label] ?? 0
    // Coordinate tap is more reliable than text (drawer also has Home/Search labels)
    await tap(Math.round((dim.w / 5) * (i + 0.5)), dim.h - 26)
    await sleep(1600)
  }

  async function goBack() {
    // prefer header back
    const back = (
      await c('Runtime.evaluate', {
        returnByValue: true,
        expression: `(()=>{
      const el=[...document.querySelectorAll('[aria-label],div,span')].find(e=>{
        const a=(e.getAttribute('aria-label')||'').toLowerCase();
        return a.includes('back')||a.includes('go back');
      });
      if(el){const r=el.getBoundingClientRect(); if(r.width>0) return {x:r.x+r.width/2,y:r.y+r.height/2};}
      // top-left chevron area
      return {x:28,y:56};
    })()`,
      })
    ).result.value
    await tap(back.x, back.y)
    await sleep(1000)
  }

  async function openDrawerAndClick(label) {
    await tap(28, 56)
    await sleep(600)
    await c('Runtime.evaluate', {
      expression: `(()=>{
      for(const el of document.querySelectorAll('div')){
        const st=getComputedStyle(el); const r=el.getBoundingClientRect();
        if((st.position==='absolute'||st.position==='fixed') && r.width>200&&r.width<320&&r.height>400){
          el.style.transform='translateX(0px)';
          el.style.left='0px';
          el.style.pointerEvents='auto';
        }
      }
    })()`,
    })
    await sleep(350)
    const hit = (
      await c('Runtime.evaluate', {
        returnByValue: true,
        expression: `(()=>{
      const label=${JSON.stringify(label)};
      let best=null;
      for(const el of document.querySelectorAll('div,span')){
        if((el.innerText||'').trim()!==label) continue;
        const r=el.getBoundingClientRect();
        if(r.left<0||r.left>300||r.top<60||r.width<20) continue;
        best={x:r.x+r.width/2,y:r.y+r.height/2};
      }
      return best;
    })()`,
      })
    ).result.value
    if (!hit) throw new Error('drawer item missing: ' + label)
    await tap(hit.x, hit.y)
    await sleep(1200)
    await closeDrawer().catch(() => {})
    await sleep(500)
  }

  async function probeBugs(name) {
    return (
      await c('Runtime.evaluate', {
        returnByValue: true,
        expression: `(()=>{
      const name=${JSON.stringify(name)};
      const body=(document.body&&document.body.innerText||'').replace(/\\s+/g,' ').trim();
      const issues=[];
      if(body.length<30) issues.push('blank');
      if(/Preparing your experience/i.test(body)) issues.push('loader');
      if(/Unable to load|Something went wrong/i.test(body)) issues.push('error');
      // large empty gap: last visible text far above bottom tab
      const texts=[...document.querySelectorAll('div,span,p,button')].filter(el=>{
        const t=(el.innerText||'').trim();
        if(!t||t.length>60||t.includes('\\n')) return false;
        const r=el.getBoundingClientRect();
        return r.top>80 && r.top<innerHeight-90 && r.left>=0 && r.width>40;
      });
      let maxBottom=0;
      for(const el of texts){ const r=el.getBoundingClientRect(); maxBottom=Math.max(maxBottom, r.bottom); }
      const gap = innerHeight - 70 - maxBottom;
      if(gap>180 && texts.length>0) issues.push('large_bottom_whitespace:'+Math.round(gap));
      // clipped scrollport still hidden
      const hiddenClip=[...document.querySelectorAll('div')].filter(el=>{
        const st=getComputedStyle(el);
        return st.overflowY==='hidden' && el.scrollHeight>el.clientHeight+60 && el.clientHeight>160;
      }).length;
      if(hiddenClip) issues.push('overflow_hidden_clip:'+hiddenClip);
      const ports=[...document.querySelectorAll('div')].filter(e=>e.scrollHeight>e.clientHeight+40 && e.clientHeight>140);
      const notAtBottom=ports.filter(e=>e.scrollTop < e.scrollHeight-e.clientHeight-30).length;
      // header-ish
      let header=null;
      for(const el of document.querySelectorAll('div,span,h1')){
        const t=(el.innerText||'').trim();
        if(!t||t.length>36||t.includes('\\n')) continue;
        const r=el.getBoundingClientRect();
        if(r.top>8&&r.top<88&&r.left>50&&r.height<42){ header=t; break; }
      }
      const visibleLabels=[...new Set(texts.map(e=>(e.innerText||'').trim()))].slice(0,20);
      return {name, header, issues, gap:Math.round(gap), ports:ports.length, notAtBottom, textLen:body.length, visibleLabels, fix:!!window.__GF_WEB_SCROLL_FIX__};
    })()`,
      })
    ).result.value
  }

  const report = {
    startedAt: new Date().toISOString(),
    dim,
    screens: [],
  }

  async function visit(name, navigateFn, expectHints = []) {
    console.log('→', name)
    const entry = { name, issues: [], expectHints }
    try {
      await navigateFn()
      await harden()
      await sleep(400)
      const topShot = await shot(`${String(report.screens.length + 1).padStart(2, '0')}-${name}-top`)
      entry.top = topShot.file
      const topProbe = await probeBugs(name + '-top')
      entry.header = topProbe.header
      entry.topLabels = topProbe.visibleLabels
      entry.topIssues = topProbe.issues

      await scrollToBottom()
      await harden()
      const botShot = await shot(`${String(report.screens.length + 1).padStart(2, '0')}-${name}-bottom`)
      entry.bottom = botShot.file
      const botProbe = await probeBugs(name + '-bottom')
      entry.bottomLabels = botProbe.visibleLabels
      entry.bottomIssues = botProbe.issues
      entry.gap = botProbe.gap
      entry.ports = await mainScrollports()

      const issues = new Set([...(topProbe.issues || []), ...(botProbe.issues || [])])
      // expectation miss
      if (expectHints.length) {
        const blob = `${entry.header || ''} ${(entry.topLabels || []).join(' ')} ${(entry.bottomLabels || []).join(' ')}`
        const ok = expectHints.some((h) => new RegExp(h, 'i').test(blob))
        if (!ok) issues.add('wrong_screen_or_missing_content')
      }
      // bottom still has huge whitespace after scroll
      if (botProbe.gap > 220) issues.add('bottom_whitespace')
      entry.issues = [...issues]
      console.log(
        '  header=',
        entry.header,
        'issues=',
        entry.issues.join(',') || 'none',
        'gap=',
        entry.gap
      )
    } catch (e) {
      entry.issues = ['nav_error:' + e.message]
      console.log('  ERR', e.message)
      try {
        await shot(`${String(report.screens.length + 1).padStart(2, '0')}-${name}-error`)
      } catch {}
    }
    report.screens.push(entry)
  }

  // ---- TABS ----
  await visit('tab-home', async () => tapTab('Home'), ['Delivery|Special Offers|Browse'])
  await visit('tab-search', async () => tapTab('Search'), ['Quick Actions|Trending|Search restaurants'])
  await visit('tab-cart', async () => tapTab('Cart'), ['Cart|Start shopping|empty'])
  await visit('tab-orders', async () => tapTab('Order History'), ['Order|History|No orders|Past'])
  await visit('tab-account', async () => tapTab('My Account'), ['Profile|Activity|Edit Profile|Account'])

  // ---- ACCOUNT CHILDREN (scroll account then open each) ----
  const accountRows = [
    ['Edit Profile', ['Edit|Profile|Name|Email|Save']],
    ['Favorites', ['Favorite|No favorite|Restaurant']],
    ['Wallet', ['Balance|Payment|Add Money|Wallet']],
    ['Subscription', ['Subscription|plan|Subscribe|Free']],
    ['Addresses', ['Address|Add|Tips']],
    ['Settings', ['Language|Preferences|Privacy|Logout|Settings']],
    ['Help & Support', ['Help|FAQ|Contact|Support']],
    ['About', ['About|Version|Good']],
  ]

  for (const [row, hints] of accountRows) {
    await visit(
      'account-' + row.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      async () => {
        await tapTab('My Account')
        await harden()
        await scrollToBottom()
        // ensure row visible: scroll until found
        for (let i = 0; i < 6; i++) {
          const hit = await visibleExact(row)
          if (hit) {
            await tap(hit.x, hit.y)
            await sleep(1600)
            return
          }
          // nudge scroll
          await c('Runtime.evaluate', {
            expression: `(()=>{const el=[...document.querySelectorAll('div')].filter(e=>e.scrollHeight>e.clientHeight+40).sort((a,b)=>(b.scrollHeight-b.clientHeight)-(a.scrollHeight-a.clientHeight))[0]; if(el) el.scrollTop+=220;})()`,
          })
          await sleep(250)
        }
        // partial fallback
        const partial = await clickLabel(row.split(' ')[0])
        if (!partial) throw new Error('cannot open ' + row)
      },
      hints
    )
    await goBack()
  }

  // ---- DRAWER ----
  for (const [label, hints] of [
    ['Near me', ['Near|map|Restaurant|km']],
    ['Offers & Discounts', ['Offer|Discount|Promo']],
    ['Wallet', ['Balance|Payment|Wallet']],
    ['Settings', ['Language|Preferences|Settings']],
  ]) {
    await visit(
      'drawer-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      async () => {
        await tapTab('Home')
        await openDrawerAndClick(label)
      },
      hints
    )
  }

  // ---- HOME deep links ----
  await visit(
    'home-map-button',
    async () => {
      await tapTab('Home')
      await harden()
      // try Near me chip / map icon
      let hit = await visibleExact('Near me')
      if (!hit) {
        // top-right filter/map area fallbacks
        await tap(dim.w - 36, 96)
        await sleep(1400)
        return
      }
      await tap(hit.x, hit.y)
      await sleep(1600)
    },
    ['map|Near|Restaurant|km|OpenStreet|leaflet']
  )

  await visit(
    'home-restaurant-detail',
    async () => {
      await tapTab('Home')
      await harden()
      await c('Runtime.evaluate', {
        expression: `(()=>{const el=[...document.querySelectorAll('div')].filter(e=>e.scrollHeight>e.clientHeight+40).sort((a,b)=>(b.scrollHeight-b.clientHeight)-(a.scrollHeight-a.clientHeight))[0]; if(el) el.scrollTop=400;})()`,
      })
      await sleep(400)
      // tap a restaurant name-ish card in mid list
      await tap(dim.w * 0.5, dim.h * 0.62)
      await sleep(2000)
    },
    ['Menu|Add|Delivery|Restaurant|Reviews|min']
  )
  await goBack()

  await visit(
    'search-trending-pizza',
    async () => {
      await tapTab('Search')
      await harden()
      const hit = await visibleExact('Pizza')
      if (hit) {
        await tap(hit.x, hit.y)
        await sleep(1600)
      } else throw new Error('Pizza chip missing')
    },
    ['Pizza|Restaurant|Result|Search']
  )

  report.finishedAt = new Date().toISOString()
  report.issueCount = report.screens.reduce((n, s) => n + (s.issues?.length || 0), 0)
  report.byIssue = {}
  for (const s of report.screens) {
    for (const i of s.issues || []) {
      report.byIssue[i] = (report.byIssue[i] || 0) + 1
    }
  }
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(report, null, 2))
  console.log('\nDONE', report.screens.length, 'screens,', report.issueCount, 'issue flags')
  console.log(JSON.stringify(report.byIssue, null, 2))
  // compact console table
  for (const s of report.screens) {
    console.log(
      `- ${s.name} | header=${s.header || '?'} | ${s.issues.join(', ') || 'ok'} | gap=${s.gap ?? '-'}`
    )
  }
  ws.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
