import i18n from '../lang/i18n';

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

  // Vérifie que ce sont bien des tableaux
  if (!Array.isArray(oldData) || !Array.isArray(newData)) {
    return true;
  }

  // Taille différente = changement
  if (oldData.length !== newData.length) return true;

  // Fonction pour trier les clés des objets récursivement
  const sortObject = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(sortObject);
    }

    if (obj !== null && typeof obj === "object") {
      return Object.keys(obj)
        .sort()
        .reduce((acc, key) => {
          acc[key] = sortObject(obj[key]);
          return acc;
        }, {});
    }

    return obj;
  };

  // Normalisation complète des données
  const normalize = (data) =>
    data.map(sortObject).sort((a, b) => {
      const aStr = JSON.stringify(a);
      const bStr = JSON.stringify(b);
      return aStr.localeCompare(bStr);
    });

  const normalizedOld = normalize(oldData);
  const normalizedNew = normalize(newData);

  return JSON.stringify(normalizedOld) !== JSON.stringify(normalizedNew);
};

export const cacheI18n = i18n;

