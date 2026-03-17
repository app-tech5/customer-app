import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CACHE_KEYS,
  CACHE_CONFIG,
  isCacheExpired,
  hasDataChanged,
  cacheI18n as i18n,
} from './cacheCommon';

export const getFoodsCacheKey = (restaurantId) =>
  `${CACHE_KEYS.RESTAURANT_FOODS}${restaurantId}`;

export const getTimestampCacheKey = (restaurantId) =>
  `${CACHE_KEYS.RESTAURANT_FOODS}${restaurantId}${CACHE_KEYS.CACHE_TIMESTAMP}`;

export const saveFoodsToCache = async (restaurantId, data) => {
  try {
    if (!data || !Array.isArray(data)) {
      console.warn(i18n.t('cache.invalidDataSaveAttempt'));
      return;
    }

    const cacheKey = getFoodsCacheKey(restaurantId);
    const timestampKey = getTimestampCacheKey(restaurantId);

    const cacheData = {
      data,
      version: CACHE_CONFIG.VERSION,
      timestamp: Date.now(),
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    await AsyncStorage.setItem(timestampKey, cacheData.timestamp.toString());
  } catch (error) {
    console.error(i18n.t('cache.saveError'), error);
  }
};

export const getFoodsFromCache = async (restaurantId) => {
  try {
    const cacheKey = getFoodsCacheKey(restaurantId);
    const timestampKey = getTimestampCacheKey(restaurantId);

    const cachedData = await AsyncStorage.getItem(cacheKey);
    const timestamp = await AsyncStorage.getItem(timestampKey);

    if (!cachedData) {
      return null;
    }

    const parsedData = JSON.parse(cachedData);

    if (parsedData.version !== CACHE_CONFIG.VERSION) {
      await clearFoodsCache(restaurantId);
      return null;
    }

    if (isCacheExpired(parsedData.timestamp)) {
      await clearFoodsCache(restaurantId);
      return null;
    }

    return {
      data: parsedData.data,
      timestamp: parsedData.timestamp,
      fromCache: true,
    };
  } catch (error) {
    console.error(i18n.t('cache.readError'), error);
    return null;
  }
};

export const clearFoodsCache = async (restaurantId) => {
  try {
    const cacheKey = getFoodsCacheKey(restaurantId);
    const timestampKey = getTimestampCacheKey(restaurantId);

    await AsyncStorage.removeItem(cacheKey);
    await AsyncStorage.removeItem(timestampKey);
  } catch (error) {
    console.error(i18n.t('cache.clearError'), error);
  }
};

export const loadFoodsWithSmartCache = async (
  restaurantId,
  apiFetcher,
  onDataLoaded,
  onDataUpdated,
  onLoadingStateChange,
) => {
  if (!restaurantId) {
    console.error(i18n.t('cache.restaurantIdRequired'));
    return;
  }

  try {
    onLoadingStateChange?.(true);
    const cachedData = await getFoodsFromCache(restaurantId);

    if (cachedData && cachedData.data) {
      onDataLoaded(cachedData.data, true);
      onLoadingStateChange?.(false);
    } else {
      onLoadingStateChange?.(true);
    }

    const freshData = await apiFetcher(restaurantId);

    if (freshData && Array.isArray(freshData)) {
      const hasChanged =
        !cachedData || hasDataChanged(cachedData.data, freshData);

      if (hasChanged) {
        await saveFoodsToCache(restaurantId, freshData);
        onDataUpdated(freshData);
      }
    } else {
      console.warn(i18n.t('cache.invalidApiData'));
    }

    onLoadingStateChange?.(false);
  } catch (error) {
    console.error(i18n.t('cache.loadSmartError'), error);
    onLoadingStateChange?.(false);

    const fallbackCache = await getFoodsFromCache(restaurantId);
    if (fallbackCache && fallbackCache.data) {
      onDataLoaded(fallbackCache.data, true);
    }
  }
};

