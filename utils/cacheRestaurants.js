import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CACHE_KEYS,
  CACHE_CONFIG,
  isCacheExpired,
  hasDataChanged,
  cacheI18n as i18n,
} from './cacheCommon';

export const saveRestaurantsToCache = async (restaurants) => {
  try {
    if (!restaurants || !Array.isArray(restaurants)) {
      console.warn(i18n.t('cache.invalidRestaurantsSaveAttempt'));
      return;
    }

    const cacheKey = CACHE_KEYS.RESTAURANTS;
    const timestampKey = CACHE_KEYS.RESTAURANTS + CACHE_KEYS.CACHE_TIMESTAMP;

    const cacheData = {
      data: restaurants,
      version: CACHE_CONFIG.VERSION,
      timestamp: Date.now(),
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    await AsyncStorage.setItem(timestampKey, cacheData.timestamp.toString());
  } catch (error) {
    console.error(i18n.t('cache.saveRestaurantsError'), error);
  }
};

export const getRestaurantsFromCache = async () => {
  try {
    const cacheKey = CACHE_KEYS.RESTAURANTS;
    const timestampKey = CACHE_KEYS.RESTAURANTS + CACHE_KEYS.CACHE_TIMESTAMP;

    const cachedData = await AsyncStorage.getItem(cacheKey);
    const timestamp = await AsyncStorage.getItem(timestampKey);

    if (!cachedData) {
      return null;
    }

    const parsedData = JSON.parse(cachedData);

    if (parsedData.version !== CACHE_CONFIG.VERSION) {
      await clearRestaurantsCache();
      return null;
    }

    if (isCacheExpired(parsedData.timestamp)) {
      await clearRestaurantsCache();
      return null;
    }

    return {
      data: parsedData.data,
      timestamp: parsedData.timestamp,
      fromCache: true,
    };
  } catch (error) {
    console.error(i18n.t('cache.readRestaurantsError'), error);
    return null;
  }
};

export const clearRestaurantsCache = async () => {
  try {
    const cacheKey = CACHE_KEYS.RESTAURANTS;
    const timestampKey = CACHE_KEYS.RESTAURANTS + CACHE_KEYS.CACHE_TIMESTAMP;

    await AsyncStorage.removeItem(cacheKey);
    await AsyncStorage.removeItem(timestampKey);
  } catch (error) {
    console.error(i18n.t('cache.clearRestaurantsError'), error);
  }
};

export const loadRestaurantsWithSmartCache = async (
  apiFetcher,
  onDataLoaded,
  onDataUpdated,
  onLoadingStateChange,
) => {
  try {
    onLoadingStateChange?.(true);
    const cachedData = await getRestaurantsFromCache();

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
        await saveRestaurantsToCache(freshData);
        onDataUpdated(freshData);
      }
    } else {
      console.warn(i18n.t('cache.invalidRestaurantsApiData'));
    }

    onLoadingStateChange?.(false);
  } catch (error) {
    console.error(i18n.t('cache.loadRestaurantsSmartError'), error);
    onLoadingStateChange?.(false);

    const fallbackCache = await getRestaurantsFromCache();
    if (fallbackCache && fallbackCache.data) {
      onDataLoaded(fallbackCache.data, true);
    }
  }
};

