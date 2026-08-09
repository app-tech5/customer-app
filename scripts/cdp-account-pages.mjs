#!/usr/bin/env node
import WebSocket from 'ws'
import fs from 'fs'
import path from 'path'

const OUT =
  process.env.GF_CRAWL_OUT ||
  '/Users/nass/Documents/good-foods-description/img/pro/visuals/out/qa-web/crawl/all/account-pass2'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
fs.mkdirSync(OUT, { recursive: true })

const rows = [
  'Edit Profile',
  'Favorites',
  'Wallet',
  'Subscription',
  'Addresses',
  'Settings',
  'Help & Support',
  'About',
]

async function main() {
  const list = await (await fetch('http://127.0.0.1:9222/json/list')).json()
  const page =
    list.find((p) => p.type === 'page' && /ap3|acctpass|demo\/customer/.test(p.url || '')) ||
    list.find((p) => p.type === 'page' && /demo\/customer/.test(p.url || ''))
  if (!page) throw new Error('no page')
  console.log('page', page.id)

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
        reject(new Error(method))
      }, 30000)
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
  await c('Page.navigate', {
    url: 'https://good-foods.digitaldienste.fr/demo/customer/?ap4=' + Date.now(),
  })
  await sleep(5000)
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
    fs.writeFileSync(path.join(OUT, name + '.jpg'), Buffer.from(s.data, 'base64'))
    console.log('shot', name)
  }
  async function closeDrawer() {
    await c('Runtime.evaluate', {
      expression: `(()=>{
      const vh=innerHeight;
      for(const el of document.querySelectorAll('div')){
        const st=getComputedStyle(el); const r=el.getBoundingClientRect();
        if((st.position==='absolute'||st.position==='fixed') && r.width>200&&r.width<320&&r.height>vh*0.5 && r.left>-50 && r.left<120){
          el.style.setProperty('transform','translateX(-120%)','important');
          el.style.setProperty('pointer-events','none','important');
        }
      }
    })()`,
    })
    await tap(dim.w - 16, dim.h * 0.45)
    await sleep(350)
  }
  async function goAccount() {
    await closeDrawer()
    await tap(Math.round(dim.w * 0.9), dim.h - 28)
    await sleep(1500)
    await closeDrawer()
  }
  async function scrollMainBottom() {
    await c('Runtime.evaluate', {
      expression: `(()=>{
      const els=[...document.querySelectorAll('div')].filter(e=>{
        const r=e.getBoundingClientRect();
        return e.scrollHeight>e.clientHeight+40 && r.width>300 && r.left>=0;
      });
      els.sort((a,b)=>(b.scrollHeight-b.clientHeight)-(a.scrollHeight-a.clientHeight));
      if(els[0]) els[0].scrollTop=els[0].scrollHeight;
    })()`,
    })
    await sleep(400)
  }
  async function openRow(label) {
    await goAccount()
    for (let i = 0; i < 12; i++) {
      const hit = (
        await c('Runtime.evaluate', {
          returnByValue: true,
          expression: `(()=>{
        const label=${JSON.stringify(label)};
        let best=null;
        for(const el of document.querySelectorAll('div,span')){
          const t=(el.innerText||'').trim();
          if(t!==label && !t.startsWith(label+'\\n')) continue;
          const r=el.getBoundingClientRect();
          if(r.top<70||r.top>innerHeight-70||r.left<20||r.left>innerWidth-20) continue;
          best={x:r.x+r.width/2,y:r.y+Math.min(20,r.height/2)};
        }
        return best;
      })()`,
        })
      ).result.value
      if (hit) {
        await tap(hit.x, hit.y)
        await sleep(1500)
        return true
      }
      await c('Runtime.evaluate', {
        expression: `(()=>{
        const els=[...document.querySelectorAll('div')].filter(e=>{
          const r=e.getBoundingClientRect();
          return e.scrollHeight>e.clientHeight+40 && r.width>300 && r.left>=0;
        });
        const el=els.sort((a,b)=>(b.scrollHeight-b.clientHeight)-(a.scrollHeight-a.clientHeight))[0];
        if(el) el.scrollTop += 220;
      })()`,
      })
      await sleep(200)
    }
    return false
  }
  async function header() {
    return (
      await c('Runtime.evaluate', {
        returnByValue: true,
        expression: `(()=>{
      for(const el of document.querySelectorAll('div,span,h1')){
        const t=(el.innerText||'').trim();
        if(!t||t.length>36||t.includes('\\n')) continue;
        const r=el.getBoundingClientRect();
        if(r.top>8&&r.top<90&&r.left>50&&r.height<40) return t;
      }
      return null;
    })()`,
      })
    ).result.value
  }

  await goAccount()
  await shot('profile-top')
  await scrollMainBottom()
  await shot('profile-bottom')

  const report = []
  for (const row of rows) {
    const ok = await openRow(row)
    await closeDrawer()
    const slug = row.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    await shot(slug + '-top')
    await scrollMainBottom()
    await shot(slug + '-bottom')
    const h = await header()
    report.push({ row, ok, header: h })
    console.log('→', row, ok, h)
    await tap(28, 56)
    await sleep(900)
    await closeDrawer()
  }

  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  ws.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
