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

    console.log(`💾 Données sauvegardées en cache pour restaurant ${restaurantId}: ${data.length} produits`);
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
      console.log(`📭 Pas de données en cache pour restaurant ${restaurantId}`);
      return null;
    }

    const parsedData = JSON.parse(cachedData);
    
    if (parsedData.version !== CACHE_CONFIG.VERSION) {
      console.log(`🔄 Version du cache obsolète pour restaurant ${restaurantId}, suppression`);
      await clearFoodsCache(restaurantId);
      return null;
    }
    
    if (isCacheExpired(parsedData.timestamp)) {
      console.log(`⏰ Cache expiré pour restaurant ${restaurantId}, suppression`);
      await clearFoodsCache(restaurantId);
      return null;
    }

    console.log(`📖 Données chargées depuis le cache pour restaurant ${restaurantId}: ${parsedData.data.length} produits`);
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

    console.log(`🗑️ Cache supprimé pour restaurant ${restaurantId}`);
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
    console.log(`🚀 Démarrage du chargement intelligent pour restaurant ${restaurantId}`);
    
    onLoadingStateChange?.(true);
    const cachedData = await getFoodsFromCache(restaurantId);

    if (cachedData && cachedData.data) {
      console.log('⚡ Données du cache affichées immédiatement');
      onDataLoaded(cachedData.data, true); 
      onLoadingStateChange?.(false);
    } else {
      console.log('📭 Pas de cache disponible, attente des données API');
      onLoadingStateChange?.(true);
    }
    
    console.log('🌐 Fetch API en arrière-plan...');
    const freshData = await apiFetcher(restaurantId);

    if (freshData && Array.isArray(freshData)) {
      console.log(`📡 Données API reçues: ${freshData.length} produits`);
      
      const hasChanged = !cachedData || hasDataChanged(cachedData.data, freshData);

      if (hasChanged) {
        console.log('🔄 Données mises à jour, sauvegarde en cache et affichage');
        
        await saveFoodsToCache(restaurantId, freshData);
        
        onDataUpdated(freshData);
      } else {
        console.log('✅ Données identiques, pas de mise à jour nécessaire');
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
      console.log('🔄 Erreur API, utilisation du cache comme fallback');
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

    console.log(`💾 Liste des restaurants sauvegardée en cache: ${restaurants.length} restaurants`);
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
      console.log(`📭 Pas de restaurants en cache`);
      return null;
    }

    const parsedData = JSON.parse(cachedData);
    
    if (parsedData.version !== CACHE_CONFIG.VERSION) {
      console.log(`🔄 Version du cache des restaurants obsolète, suppression`);
      await clearRestaurantsCache();
      return null;
    }
    
    if (isCacheExpired(parsedData.timestamp)) {
      console.log(`⏰ Cache des restaurants expiré, suppression`);
      await clearRestaurantsCache();
      return null;
    }

    console.log(`📖 Restaurants chargés depuis le cache: ${parsedData.data.length} restaurants`);
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

    console.log(`🗑️ Cache des restaurants supprimé`);
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
    console.log(`🚀 Démarrage du chargement intelligent des restaurants`);
    
    onLoadingStateChange?.(true);
    const cachedData = await getRestaurantsFromCache();

    if (cachedData && cachedData.data) {
      console.log('⚡ Restaurants affichés depuis le cache');
      onDataLoaded(cachedData.data, true); 
      onLoadingStateChange?.(false);
    } else {
      console.log('📭 Pas de cache disponible, attente des données API');
      onLoadingStateChange?.(true);
    }
    
    console.log('🌐 Fetch API en arrière-plan pour les restaurants...');
    const freshData = await apiFetcher();

    if (freshData && Array.isArray(freshData)) {
      console.log(`📡 Restaurants API reçus: ${freshData.length} restaurants`);
      
      const hasChanged = !cachedData || hasDataChanged(cachedData.data, freshData);

      if (hasChanged) {
        console.log('🔄 Restaurants mis à jour, sauvegarde en cache et affichage');
        
        await saveRestaurantsToCache(freshData);
        
        onDataUpdated(freshData);
      } else {
        console.log('✅ Restaurants identiques, pas de mise à jour nécessaire');
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
      console.log('🔄 Erreur API, utilisation du cache comme fallback');
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

    console.log(`💾 Promotions sauvegardées en cache: ${promotions.length} promotions`);
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
      console.log(`📭 Pas de promotions en cache`);
      return null;
    }

    const parsedData = JSON.parse(cachedData);
    
    if (parsedData.version !== CACHE_CONFIG.VERSION) {
      console.log(`🔄 Version du cache des promotions obsolète, suppression`);
      await clearPromotionsCache();
      return null;
    }
    
    if (isCacheExpired(parsedData.timestamp)) {
      console.log(`⏰ Cache des promotions expiré, suppression`);
      await clearPromotionsCache();
      return null;
    }

    console.log(`📖 Promotions chargées depuis le cache: ${parsedData.data.length} promotions`);
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

    console.log(`💾 Menus sauvegardés en cache: ${menus.length} menus`);
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
      console.log(`📭 Pas de menus en cache`);
      return null;
    }

    const parsedData = JSON.parse(cachedData);
    
    if (parsedData.version !== CACHE_CONFIG.VERSION) {
      console.log(`🔄 Version du cache des menus obsolète, suppression`);
      await clearMenusCache();
      return null;
    }
    
    if (isCacheExpired(parsedData.timestamp)) {
      console.log(`⏰ Cache des menus expiré, suppression`);
      await clearMenusCache();
      return null;
    }

    console.log(`📖 Menus chargés depuis le cache: ${parsedData.data.length} menus`);
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
    console.log(`🚀 Démarrage du chargement intelligent des promotions`);
    
    onLoadingStateChange?.(true);
    const cachedData = await getPromotionsFromCache();

    if (cachedData && cachedData.data) {
      console.log('⚡ Promotions affichées depuis le cache');
      onDataLoaded(cachedData.data, true);
      onLoadingStateChange?.(false);
    } else {
      console.log('📭 Pas de cache disponible pour les promotions, attente des données API');
      onLoadingStateChange?.(true);
    }
    
    console.log('🌐 Fetch API en arrière-plan pour les promotions...');
    const freshData = await apiFetcher();

    if (freshData && Array.isArray(freshData)) {
      console.log(`📡 Promotions API reçues: ${freshData.length} promotions`);
      
      const hasChanged = !cachedData || hasDataChanged(cachedData.data, freshData);

      if (hasChanged) {
        console.log('🔄 Promotions mises à jour, sauvegarde en cache');
        
        await savePromotionsToCache(freshData);
        
        onDataUpdated(freshData);
      } else {
        console.log('✅ Promotions identiques, pas de mise à jour nécessaire');
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
      console.log('🔄 Erreur API promotions, utilisation du cache comme fallback');
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
    console.log(`🚀 Démarrage du chargement intelligent des menus`);
    
    onLoadingStateChange?.(true);
    const cachedData = await getMenusFromCache();

    if (cachedData && cachedData.data) {
      console.log('⚡ Menus affichés depuis le cache');
      onDataLoaded(cachedData.data, true);
      onLoadingStateChange?.(false);
    } else {
      console.log('📭 Pas de cache disponible pour les menus, attente des données API');
      onLoadingStateChange?.(true);
    }
    
    console.log('🌐 Fetch API en arrière-plan pour les menus...');
    const freshData = await apiFetcher();

    if (freshData && Array.isArray(freshData)) {
      console.log(`📡 Menus API reçus: ${freshData.length} menus`);
      
      const hasChanged = !cachedData || hasDataChanged(cachedData.data, freshData);

      if (hasChanged) {
        console.log('🔄 Menus mis à jour, sauvegarde en cache');
        
        await saveMenusToCache(freshData);
        
        onDataUpdated(freshData);
      } else {
        console.log('✅ Menus identiques, pas de mise à jour nécessaire');
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
      console.log('🔄 Erreur API menus, utilisation du cache comme fallback');
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

    console.log(`🗑️ Cache des promotions supprimé`);
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

    console.log(`🗑️ Cache des menus supprimé`);
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du cache des menus:', error);
  }
};

export const cleanupExpiredCache = async () => {
  try {
    console.log('🧹 Nettoyage des caches expirés...');

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
      console.log(`🗑️ ${cleanedCount} caches expirés supprimés`);
    } else {
      console.log('✨ Aucun cache expiré trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage du cache:', error);
  }
};

export const saveSignInData = async (email, rememberMe = true) => {
  try {
    if (!email || !rememberMe) {
      console.log('🔒 Pas de sauvegarde des données de connexion');
      return;
    }

    const signInData = {
      email: email.trim().toLowerCase(),
      rememberMe: true,
      timestamp: Date.now(),
      version: CACHE_CONFIG.VERSION
    };

    await AsyncStorage.setItem(CACHE_KEYS.USER_SIGNIN_DATA, JSON.stringify(signInData));
    console.log('💾 Données de connexion sauvegardées pour:', email);

  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde des données de connexion:', error);
  }
};

export const getSignInData = async () => {
  try {
    const cachedData = await AsyncStorage.getItem(CACHE_KEYS.USER_SIGNIN_DATA);

    if (!cachedData) {
      console.log('📭 Aucune donnée de connexion en cache');
      return null;
    }

    const parsedData = JSON.parse(cachedData);
    
    if (parsedData.version !== CACHE_CONFIG.VERSION) {
      console.log('🔄 Version du cache de connexion obsolète, suppression');
      await clearSignInData();
      return null;
    }

    console.log('📖 Données de connexion chargées depuis le cache');
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
    console.log('🗑️ Données de connexion supprimées');
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
 