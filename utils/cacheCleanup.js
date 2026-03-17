import AsyncStorage from '@react-native-async-storage/async-storage';
import { CACHE_KEYS, isCacheExpired, cacheI18n as i18n } from './cacheCommon';
import { clearFoodsCache } from './cacheFoods';
import { clearRestaurantsCache } from './cacheRestaurants';
import { clearPromotionsCache } from './cachePromotions';
import { clearMenusCache } from './cacheMenus';

export const cleanupExpiredCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const timestampKeys = keys.filter((key) =>
      key.includes(CACHE_KEYS.CACHE_TIMESTAMP),
    );

    let cleanedCount = 0;

    for (const timestampKey of timestampKeys) {
      const timestamp = await AsyncStorage.getItem(timestampKey);

      if (isCacheExpired(parseInt(timestamp, 10))) {
        if (timestampKey.includes(CACHE_KEYS.RESTAURANT_FOODS)) {
          const restaurantId = timestampKey
            .replace(CACHE_KEYS.RESTAURANT_FOODS, '')
            .replace(CACHE_KEYS.CACHE_TIMESTAMP, '');
          await clearFoodsCache(restaurantId);
        } else if (
          timestampKey === CACHE_KEYS.RESTAURANTS + CACHE_KEYS.CACHE_TIMESTAMP
        ) {
          await clearRestaurantsCache();
        } else if (
          timestampKey === CACHE_KEYS.PROMOTIONS + CACHE_KEYS.CACHE_TIMESTAMP
        ) {
          await clearPromotionsCache();
        } else if (
          timestampKey === CACHE_KEYS.MENUS + CACHE_KEYS.CACHE_TIMESTAMP
        ) {
          await clearMenusCache();
        }
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      // Optionally log or track cleaned entries
    }
  } catch (error) {
    console.error(i18n.t('cache.cleanupError'), error);
  }
};

