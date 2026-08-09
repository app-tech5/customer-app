import { Platform } from 'react-native'

/**
 * Web scroll is broken in two common RN-web cases (CDP-proven on Chrome/ADB):
 * 1) stack/drawer cards clip with overflow:hidden while content is taller
 * 2) ScrollView has overflow:auto but touch/wheel still won't pan (flex + missing
 *    touch-action / min-height:0). Promote real scrollports to overflow-y:scroll
 *    with pan-y + min-height:0.
 */
export function installWebScrollFix() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return
  if (typeof window !== 'undefined' && window.__GF_WEB_SCROLL_FIX__) return
  if (typeof window !== 'undefined') window.__GF_WEB_SCROLL_FIX__ = true

  const shouldSkip = (el) => {
    if (!el || el.nodeType !== 1) return true
    if (el.querySelector?.('iframe, canvas, .leaflet-container, .maplibregl-map')) return true
    const st = window.getComputedStyle(el)
    if (st.overflowX === 'auto' || st.overflowX === 'scroll') return true
    return false
  }

  const hardenScrollport = (el) => {
    el.style.setProperty('overflow-y', 'scroll', 'important')
    el.style.setProperty('touch-action', 'pan-y', 'important')
    el.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important')
    el.style.setProperty('overscroll-behavior-y', 'contain', 'important')
    el.style.setProperty('min-height', '0', 'important')
    // Keep last rows above the bottom tab bar on web
    if (!el.dataset.gfPad) {
      const pad = Math.max(96, Number.parseInt(el.style.paddingBottom || '0', 10) || 0)
      el.style.paddingBottom = `${pad}px`
      el.dataset.gfPad = '1'
    }
    el.dataset.gfScrollOk = '1'
  }

  const fix = () => {
    const vh = window.innerHeight || 0
    for (const el of document.querySelectorAll('div')) {
      if (shouldSkip(el)) continue
      const st = window.getComputedStyle(el)
      const taller = el.scrollHeight > el.clientHeight + 40
      const viewportish = el.clientHeight > 160 && el.clientHeight <= vh + 40

      // Case 1: clipped by overflow:hidden
      if (
        taller &&
        viewportish &&
        (st.overflowY === 'hidden' || st.overflow === 'hidden')
      ) {
        hardenScrollport(el)
        continue
      }

      // Case 2: already a ScrollView scrollport but gestures fail
      if (
        taller &&
        viewportish &&
        (st.overflowY === 'auto' || st.overflowY === 'scroll') &&
        el.dataset.gfScrollOk !== '1'
      ) {
        hardenScrollport(el)
      }
    }

    // Drawer panel off-screen must not steal touches over the page
    for (const el of document.querySelectorAll('div')) {
      const st = window.getComputedStyle(el)
      if (st.position !== 'absolute' && st.position !== 'fixed') continue
      const r = el.getBoundingClientRect()
      const vw = window.innerWidth || 0
      if (r.width < 200 || r.width > 320 || r.height < vh * 0.6) continue
      if (r.right <= 0 || r.left >= vw) {
        // fully off-screen horizontally
        if (st.pointerEvents !== 'none') {
          el.style.setProperty('pointer-events', 'none', 'important')
          el.dataset.gfDrawerPe = '1'
        }
      } else if (el.dataset.gfDrawerPe === '1' && r.left >= 0) {
        el.style.removeProperty('pointer-events')
        delete el.dataset.gfDrawerPe
      }
    }
  }

  const schedule = () => {
    clearTimeout(installWebScrollFix._timer)
    installWebScrollFix._timer = setTimeout(fix, 60)
  }

  const start = () => {
    fix()
    const mo = new MutationObserver(schedule)
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    })
  }

  if (document.body) start()
  else document.addEventListener('DOMContentLoaded', start)
}
