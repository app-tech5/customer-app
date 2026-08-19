import { createNavigationContainerRef } from '@react-navigation/native'
import { Platform } from 'react-native'

/** Root ref used by NavigationContainer (signed-in stack). */
export const rootNavigationRef = createNavigationContainerRef()

/**
 * Build nested navigate() args from a path of screen names.
 * Example: ['DrawerNavigator','BottomTabs','Account','EditProfile']
 * → navigate('DrawerNavigator', { screen:'BottomTabs', params:{ screen:'Account', params:{ screen:'EditProfile' }}})
 */
export function buildNestedNavigate(path, leafParams) {
  if (!path?.length) return null
  const [root, ...rest] = path
  if (!rest.length) {
    return { name: root, params: leafParams }
  }
  let params = leafParams
  for (let i = rest.length - 1; i >= 0; i--) {
    params = { screen: rest[i], ...(params != null ? { params } : {}) }
  }
  return { name: root, params }
}

export function crawlNavigate(path, leafParams) {
  if (!rootNavigationRef.isReady()) {
    return { ok: false, reason: 'nav_not_ready' }
  }
  const built = buildNestedNavigate(path, leafParams)
  if (!built) return { ok: false, reason: 'bad_path' }
  try {
    rootNavigationRef.navigate(built.name, built.params)
    return { ok: true, path, name: built.name }
  } catch (e) {
    return { ok: false, reason: String(e?.message || e) }
  }
}

export function installWebCrawlBridge() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return

  window.__GF_NAV__ = rootNavigationRef
  window.__GF_CRAWL__ = {
    version: 1,
    ready: () => rootNavigationRef.isReady(),
    getState: () => {
      try {
        return rootNavigationRef.getRootState?.() || null
      } catch {
        return null
      }
    },
    /** @param {string[]} path screen names from root */
    navigate: (path, leafParams) => crawlNavigate(path, leafParams),
    getRestaurants: () => window.__GF_RESTAURANTS__ || [],
    getOrders: () => window.__GF_ORDERS__ || [],
  }
}
