import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CACHE_KEYS,
  CACHE_CONFIG,
  isCacheExpired,
  hasDataChanged,
  cacheI18n as i18n,
} from './cacheCommon';

export const savePromotionsToCache = async (promotions) => {
  try {
    if (!promotions || !Array.isArray(promotions)) {
      console.warn(i18n.t('cache.invalidPromotionsSaveAttempt'));
      return;
    }

    const cacheKey = CACHE_KEYS.PROMOTIONS;
    const timestampKey = CACHE_KEYS.PROMOTIONS + CACHE_KEYS.CACHE_TIMESTAMP;

    const cacheData = {
      data: promotions,
      version: CACHE_CONFIG.VERSION,
      timestamp: Date.now(),
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    await AsyncStorage.setItem(timestampKey, cacheData.timestamp.toString());
  } catch (error) {
    console.error(i18n.t('cache.savePromotionsError'), error);
  }
};

export const getPromotionsFromCache = async () => {
  try {
    const cacheKey = CACHE_KEYS.PROMOTIONS;
    const timestampKey = CACHE_KEYS.PROMOTIONS + CACHE_KEYS.CACHE_TIMESTAMP;

    const cachedData = await AsyncStorage.getItem(cacheKey);
    const timestamp = await AsyncStorage.getItem(timestampKey);

    if (!cachedData) {
      return null;
    }

    const parsedData = JSON.parse(cachedData);

    if (parsedData.version !== CACHE_CONFIG.VERSION) {
      await clearPromotionsCache();
      return null;
    }

    if (isCacheExpired(parsedData.timestamp)) {
      await clearPromotionsCache();
      return null;
    }

    return {
      data: parsedData.data,
      timestamp: parsedData.timestamp,
      fromCache: true,
    };
  } catch (error) {
    console.error(i18n.t('cache.readPromotionsError'), error);
    return null;
  }
};

export const clearPromotionsCache = async () => {
  try {
    const cacheKey = CACHE_KEYS.PROMOTIONS;
    const timestampKey = CACHE_KEYS.PROMOTIONS + CACHE_KEYS.CACHE_TIMESTAMP;

    await AsyncStorage.removeItem(cacheKey);
    await AsyncStorage.removeItem(timestampKey);
  } catch (error) {
    console.error(i18n.t('cache.clearPromotionsError'), error);
  }
};

export const loadPromotionsWithSmartCache = async (
  apiFetcher,
  onDataLoaded,
  onDataUpdated,
  onLoadingStateChange,
) => {
  try {
    onLoadingStateChange?.(true);
    const cachedData = await getPromotionsFromCache();

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
        await savePromotionsToCache(freshData);
        onDataUpdated(freshData);
      }
    } else {
      console.warn(i18n.t('cache.invalidPromotionsApiData'));
    }

    onLoadingStateChange?.(false);
  } catch (error) {
    console.error(i18n.t('cache.loadPromotionsSmartError'), error);
    onLoadingStateChange?.(false);

    const fallbackCache = await getPromotionsFromCache();
    if (fallbackCache && fallbackCache.data) {
      onDataLoaded(fallbackCache.data, true);
    }
  }
};

