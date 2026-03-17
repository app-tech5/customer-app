import i18n from '../i18n';

export const CACHE_KEYS = {
  RESTAURANT_FOODS: 'restaurant_foods_',
  RESTAURANTS: 'restaurants_list',
  PROMOTIONS: 'promotions_list',
  MENUS: 'menus_list',
  USER_SIGNIN_DATA: 'user_signin_data',
  CACHE_TIMESTAMP: '_timestamp',
  CACHE_VERSION: 'cache_version',
};

export const CACHE_CONFIG = {
  FOODS_EXPIRY: 30 * 60 * 1000,
  VERSION: '1.0',
};

export const isCacheExpired = (timestamp, expiryTime = CACHE_CONFIG.FOODS_EXPIRY) => {
  if (!timestamp) return true;
  const now = Date.now();
  return now - timestamp > expiryTime;
};

export const hasDataChanged = (oldData, newData) => {
  if (!oldData || !newData) return true;
  if (oldData.length !== newData.length) return true;

  const buildIds = (items) =>
    items.map(
      (item) => `${item.id || item._id}_${item.updatedAt || item.createdAt}`,
    );

  const oldIds = buildIds(oldData);
  const newIds = buildIds(newData);

  return JSON.stringify(oldIds.sort()) !== JSON.stringify(newIds.sort());
};

export const cacheI18n = i18n;

