import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = {
  RESTAURANT_FOODS: 'restaurant_foods_',
  RESTAURANTS: 'restaurants_list',
  PROMOTIONS: 'promotions_list',
  MENUS: 'menus_list',
  USER_SIGNIN_DATA: 'user_signin_data',
  CACHE_TIMESTAMP: '_timestamp',
  CACHE_VERSION: 'cache_version'
};

const CACHE_CONFIG = {
  FOODS_EXPIRY: 30 * 60 * 1000, 
  VERSION: '1.0'
};

export const getFoodsCacheKey = (restaurantId) => {
  return `${CACHE_KEYS.RESTAURANT_FOODS}${restaurantId}`;
};

export const getTimestampCacheKey = (restaurantId) => {
  return `${CACHE_KEYS.RESTAURANT_FOODS}${restaurantId}${CACHE_KEYS.CACHE_TIMESTAMP}`;
};

export const isCacheExpired = (timestamp, expiryTime = CACHE_CONFIG.FOODS_EXPIRY) => {
  if (!timestamp) return true;
  const now = Date.now();
  return (now - timestamp) > expiryTime;
};

export const hasDataChanged = (oldData, newData) => {
  if (!oldData || !newData) return true;
  if (oldData.length !== newData.length) return true;
  
  const oldIds = oldData.map(item => `${item.id || item._id}_${item.updatedAt || item.createdAt}`);
  const newIds = newData.map(item => `${item.id || item._id}_${item.updatedAt || item.createdAt}`);

  return JSON.stringify(oldIds.sort()) !== JSON.stringify(newIds.sort());
};

export const saveFoodsToCache = async (restaurantId, data) => {
  try {
    if (!data || !Array.isArray(data)) {
      console.warn('⚠️ Tentative de sauvegarde de données invalides en cache');
      return;
    }

    const cacheKey = getFoodsCacheKey(restaurantId);
    const timestampKey = getTimestampCacheKey(restaurantId);

    const cacheData = {
      data,
      version: CACHE_CONFIG.VERSION,
      timestamp: Date.now()
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    await AsyncStorage.setItem(timestampKey, cacheData.timestamp.toString());
    
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde en cache:', error);
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
      fromCache: true
    };

  } catch (error) {
    console.error('❌ Erreur lors de la lecture du cache:', error);
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
    console.error('❌ Erreur lors de la suppression du cache:', error);
  }
};

export const loadFoodsWithSmartCache = async (
  restaurantId,
  apiFetcher,
  onDataLoaded,
  onDataUpdated,
  onLoadingStateChange
) => {
  if (!restaurantId) {
    console.error('❌ RestaurantId requis pour le chargement des données');
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
      
      const hasChanged = !cachedData || hasDataChanged(cachedData.data, freshData);

      if (hasChanged) {
        
        await saveFoodsToCache(restaurantId, freshData);
        
        onDataUpdated(freshData);
      } else {
        
      }
    } else {
      console.warn('⚠️ Données API invalides ou vides');
    }
    
    onLoadingStateChange?.(false);

  } catch (error) {
    console.error('❌ Erreur lors du chargement intelligent:', error);
    onLoadingStateChange?.(false);
    
    const fallbackCache = await getFoodsFromCache(restaurantId);
    if (fallbackCache && fallbackCache.data) {
      
      onDataLoaded(fallbackCache.data, true);
    }
  }
};

export const saveRestaurantsToCache = async (restaurants) => {
  try {
    if (!restaurants || !Array.isArray(restaurants)) {
      console.warn('⚠️ Tentative de sauvegarde de restaurants invalides en cache');
      return;
    }

    const cacheKey = CACHE_KEYS.RESTAURANTS;
    const timestampKey = CACHE_KEYS.RESTAURANTS + CACHE_KEYS.CACHE_TIMESTAMP;

    const cacheData = {
      data: restaurants,
      version: CACHE_CONFIG.VERSION,
      timestamp: Date.now()
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    await AsyncStorage.setItem(timestampKey, cacheData.timestamp.toString());
    
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde des restaurants en cache:', error);
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
      fromCache: true
    };

  } catch (error) {
    console.error('❌ Erreur lors de la lecture du cache des restaurants:', error);
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
    console.error('❌ Erreur lors de la suppression du cache des restaurants:', error);
  }
};

export const loadRestaurantsWithSmartCache = async (
  apiFetcher,
  onDataLoaded,
  onDataUpdated,
  onLoadingStateChange
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
      
      const hasChanged = !cachedData || hasDataChanged(cachedData.data, freshData);

      if (hasChanged) {
        
        await saveRestaurantsToCache(freshData);
        
        onDataUpdated(freshData);
      } else {
        
      }
    } else {
      console.warn('⚠️ Données restaurants API invalides ou vides');
    }
    
    onLoadingStateChange?.(false);

  } catch (error) {
    console.error('❌ Erreur lors du chargement intelligent des restaurants:', error);
    onLoadingStateChange?.(false);
    
    const fallbackCache = await getRestaurantsFromCache();
    if (fallbackCache && fallbackCache.data) {
      
      onDataLoaded(fallbackCache.data, true);
    }
  }
};

export const savePromotionsToCache = async (promotions) => {
  try {
    if (!promotions || !Array.isArray(promotions)) {
      console.warn('⚠️ Tentative de sauvegarde de promotions invalides en cache');
      return;
    }

    const cacheKey = CACHE_KEYS.PROMOTIONS;
    const timestampKey = CACHE_KEYS.PROMOTIONS + CACHE_KEYS.CACHE_TIMESTAMP;

    const cacheData = {
      data: promotions,
      version: CACHE_CONFIG.VERSION,
      timestamp: Date.now()
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    await AsyncStorage.setItem(timestampKey, cacheData.timestamp.toString());
    
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde des promotions en cache:', error);
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
      fromCache: true
    };

  } catch (error) {
    console.error('❌ Erreur lors de la lecture du cache des promotions:', error);
    return null;
  }
};

export const saveMenusToCache = async (menus) => {
  try {
    if (!menus || !Array.isArray(menus)) {
      console.warn('⚠️ Tentative de sauvegarde de menus invalides en cache');
      return;
    }

    const cacheKey = CACHE_KEYS.MENUS;
    const timestampKey = CACHE_KEYS.MENUS + CACHE_KEYS.CACHE_TIMESTAMP;

    const cacheData = {
      data: menus,
      version: CACHE_CONFIG.VERSION,
      timestamp: Date.now()
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    await AsyncStorage.setItem(timestampKey, cacheData.timestamp.toString());
    
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde des menus en cache:', error);
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
      fromCache: true
    };

  } catch (error) {
    console.error('❌ Erreur lors de la lecture du cache des menus:', error);
    return null;
  }
};

export const loadPromotionsWithSmartCache = async (
  apiFetcher,
  onDataLoaded,
  onDataUpdated,
  onLoadingStateChange
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
      
      const hasChanged = !cachedData || hasDataChanged(cachedData.data, freshData);

      if (hasChanged) {
        
        await savePromotionsToCache(freshData);
        
        onDataUpdated(freshData);
      } else {
        
      }
    } else {
      console.warn('⚠️ Données promotions API invalides ou vides');
    }
    
    onLoadingStateChange?.(false);

  } catch (error) {
    console.error('❌ Erreur lors du chargement intelligent des promotions:', error);
    onLoadingStateChange?.(false);
    
    const fallbackCache = await getPromotionsFromCache();
    if (fallbackCache && fallbackCache.data) {
      
      onDataLoaded(fallbackCache.data, true);
    }
  }
};

export const loadMenusWithSmartCache = async (
  apiFetcher,
  onDataLoaded,
  onDataUpdated,
  onLoadingStateChange
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
      
      const hasChanged = !cachedData || hasDataChanged(cachedData.data, freshData);

      if (hasChanged) {
        
        await saveMenusToCache(freshData);
        
        onDataUpdated(freshData);
      } else {
        
      }
    } else {
      console.warn('⚠️ Données menus API invalides ou vides');
    }
    
    onLoadingStateChange?.(false);

  } catch (error) {
    console.error('❌ Erreur lors du chargement intelligent des menus:', error);
    onLoadingStateChange?.(false);
    
    const fallbackCache = await getMenusFromCache();
    if (fallbackCache && fallbackCache.data) {
      
      onDataLoaded(fallbackCache.data, true);
    }
  }
};

export const clearPromotionsCache = async () => {
  try {
    const cacheKey = CACHE_KEYS.PROMOTIONS;
    const timestampKey = CACHE_KEYS.PROMOTIONS + CACHE_KEYS.CACHE_TIMESTAMP;

    await AsyncStorage.removeItem(cacheKey);
    await AsyncStorage.removeItem(timestampKey);
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du cache des promotions:', error);
  }
};

export const clearMenusCache = async () => {
  try {
    const cacheKey = CACHE_KEYS.MENUS;
    const timestampKey = CACHE_KEYS.MENUS + CACHE_KEYS.CACHE_TIMESTAMP;

    await AsyncStorage.removeItem(cacheKey);
    await AsyncStorage.removeItem(timestampKey);
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du cache des menus:', error);
  }
};

export const cleanupExpiredCache = async () => {
  try {

    const keys = await AsyncStorage.getAllKeys();
    const timestampKeys = keys.filter(key => key.includes(CACHE_KEYS.CACHE_TIMESTAMP));

    let cleanedCount = 0;

    for (const timestampKey of timestampKeys) {
      const timestamp = await AsyncStorage.getItem(timestampKey);

      if (isCacheExpired(parseInt(timestamp))) {
        
        if (timestampKey.includes(CACHE_KEYS.RESTAURANT_FOODS)) {
          const restaurantId = timestampKey.replace(CACHE_KEYS.RESTAURANT_FOODS, '').replace(CACHE_KEYS.CACHE_TIMESTAMP, '');
          await clearFoodsCache(restaurantId);
        } else if (timestampKey === CACHE_KEYS.RESTAURANTS + CACHE_KEYS.CACHE_TIMESTAMP) {
          await clearRestaurantsCache();
        } else if (timestampKey === CACHE_KEYS.PROMOTIONS + CACHE_KEYS.CACHE_TIMESTAMP) {
          await clearPromotionsCache();
        } else if (timestampKey === CACHE_KEYS.MENUS + CACHE_KEYS.CACHE_TIMESTAMP) {
          await clearMenusCache();
        }
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      
    } else {
      
    }

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage du cache:', error);
  }
};

export const saveSignInData = async (email, rememberMe = true) => {
  try {
    if (!email || !rememberMe) {
      
      return;
    }

    const signInData = {
      email: email.trim().toLowerCase(),
      rememberMe: true,
      timestamp: Date.now(),
      version: CACHE_CONFIG.VERSION
    };

    await AsyncStorage.setItem(CACHE_KEYS.USER_SIGNIN_DATA, JSON.stringify(signInData));

  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde des données de connexion:', error);
  }
};

export const getSignInData = async () => {
  try {
    const cachedData = await AsyncStorage.getItem(CACHE_KEYS.USER_SIGNIN_DATA);

    if (!cachedData) {
      
      return null;
    }

    const parsedData = JSON.parse(cachedData);
    
    if (parsedData.version !== CACHE_CONFIG.VERSION) {
      
      await clearSignInData();
      return null;
    }
    
    return {
      email: parsedData.email,
      rememberMe: parsedData.rememberMe,
      timestamp: parsedData.timestamp
    };

  } catch (error) {
    console.error('❌ Erreur lors de la lecture des données de connexion:', error);
    return null;
  }
};

export const clearSignInData = async () => {
  try {
    await AsyncStorage.removeItem(CACHE_KEYS.USER_SIGNIN_DATA);
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression des données de connexion:', error);
  }
};

export const updateSignInEmail = async (newEmail) => {
  try {
    if (!newEmail) return;

    const existingData = await getSignInData();

    if (existingData) {
      await saveSignInData(newEmail, existingData.rememberMe);
    } else {
      
      await saveSignInData(newEmail, true);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'email:', error);
  }
};
 