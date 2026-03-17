import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CACHE_KEYS,
  CACHE_CONFIG,
  isCacheExpired,
  hasDataChanged,
  cacheI18n as i18n,
} from './cacheCommon';

export const saveMenusToCache = async (menus) => {
  try {
    if (!menus || !Array.isArray(menus)) {
      console.warn(i18n.t('cache.invalidMenusSaveAttempt'));
      return;
    }

    const cacheKey = CACHE_KEYS.MENUS;
    const timestampKey = CACHE_KEYS.MENUS + CACHE_KEYS.CACHE_TIMESTAMP;

    const cacheData = {
      data: menus,
      version: CACHE_CONFIG.VERSION,
      timestamp: Date.now(),
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    await AsyncStorage.setItem(timestampKey, cacheData.timestamp.toString());
  } catch (error) {
    console.error(i18n.t('cache.saveMenusError'), error);
  }
};

export const getMenusFromCache = async () => {
  try {
    const cacheKey = CACHE_KEYS.MENUS;
    const timestampKey = CACHE_KEYS.MENUS + CACHE_KEYS.CACHE_TIMESTAMP;

    const cachedData = await AsyncStorage.getItem(cacheKey);
    const timestamp = await AsyncStorage.getItem(timestampKey);

    if (!cachedData) {
      return null;
    }

    const parsedData = JSON.parse(cachedData);

    if (parsedData.version !== CACHE_CONFIG.VERSION) {
      await clearMenusCache();
      return null;
    }

    if (isCacheExpired(parsedData.timestamp)) {
      await clearMenusCache();
      return null;
    }

    return {
      data: parsedData.data,
      timestamp: parsedData.timestamp,
      fromCache: true,
    };
  } catch (error) {
    console.error(i18n.t('cache.readMenusError'), error);
    return null;
  }
};

export const clearMenusCache = async () => {
  try {
    const cacheKey = CACHE_KEYS.MENUS;
    const timestampKey = CACHE_KEYS.MENUS + CACHE_KEYS.CACHE_TIMESTAMP;

    await AsyncStorage.removeItem(cacheKey);
    await AsyncStorage.removeItem(timestampKey);
  } catch (error) {
    console.error(i18n.t('cache.clearMenusError'), error);
  }
};

export const loadMenusWithSmartCache = async (
  apiFetcher,
  onDataLoaded,
  onDataUpdated,
  onLoadingStateChange,
) => {
  try {
    onLoadingStateChange?.(true);
    const cachedData = await getMenusFromCache();

    if (cachedData && cachedData.data) {
      onDataLoaded(cachedData.data, true);
      onLoadingStateChange?.(false);
    } else {
      onLoadingStateChange?.(true);
    }

    const freshData = await apiFetcher();

    if (freshData && Array.isArray(freshData)) {
      const hasChanged =
        !cachedData || hasDataChanged(cachedData.data, freshData);

      if (hasChanged) {
        await saveMenusToCache(freshData);
        onDataUpdated(freshData);
      }
    } else {
      console.warn(i18n.t('cache.invalidMenusApiData'));
    }

    onLoadingStateChange?.(false);
  } catch (error) {
    console.error(i18n.t('cache.loadMenusSmartError'), error);
    onLoadingStateChange?.(false);

    const fallbackCache = await getMenusFromCache();
    if (fallbackCache && fallbackCache.data) {
      onDataLoaded(fallbackCache.data, true);
    }
  }
};

