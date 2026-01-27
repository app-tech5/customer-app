import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys
const CACHE_KEYS = {
  RESTAURANT_FOODS: 'restaurant_foods_',
  RESTAURANTS: 'restaurants_list',
  PROMOTIONS: 'promotions_list',
  MENUS: 'menus_list',
  USER_SIGNIN_DATA: 'user_signin_data',
  CACHE_TIMESTAMP: '_timestamp',
  CACHE_VERSION: 'cache_version'
};

// Cache configuration
const CACHE_CONFIG = {
  FOODS_EXPIRY: 30 * 60 * 1000, // 30 minutes in milliseconds
  VERSION: '1.0'
};

/**
 * Génère la clé de cache pour les produits d'un restaurant
 * @param {string} restaurantId - ID du restaurant
 * @returns {string} Clé de cache
 */
export const getFoodsCacheKey = (restaurantId) => {
  return `${CACHE_KEYS.RESTAURANT_FOODS}${restaurantId}`;
};

/**
 * Génère la clé de cache pour le timestamp
 * @param {string} restaurantId - ID du restaurant
 * @returns {string} Clé de cache pour le timestamp
 */
export const getTimestampCacheKey = (restaurantId) => {
  return `${CACHE_KEYS.RESTAURANT_FOODS}${restaurantId}${CACHE_KEYS.CACHE_TIMESTAMP}`;
};

/**
 * Vérifie si le cache est expiré
 * @param {number} timestamp - Timestamp du cache
 * @param {number} expiryTime - Temps d'expiration en ms (défaut: 30min)
 * @returns {boolean} True si expiré
 */
export const isCacheExpired = (timestamp, expiryTime = CACHE_CONFIG.FOODS_EXPIRY) => {
  if (!timestamp) return true;
  const now = Date.now();
  return (now - timestamp) > expiryTime;
};

/**
 * Compare deux ensembles de données pour voir s'ils sont différents
 * @param {Array} oldData - Anciennes données
 * @param {Array} newData - Nouvelles données
 * @returns {boolean} True si les données ont changé
 */
export const hasDataChanged = (oldData, newData) => {
  if (!oldData || !newData) return true;
  if (oldData.length !== newData.length) return true;

  // Comparaison simple basée sur les IDs et dates de modification
  const oldIds = oldData.map(item => `${item.id || item._id}_${item.updatedAt || item.createdAt}`);
  const newIds = newData.map(item => `${item.id || item._id}_${item.updatedAt || item.createdAt}`);

  return JSON.stringify(oldIds.sort()) !== JSON.stringify(newIds.sort());
};

/**
 * Sauvegarde les données en cache
 * @param {string} restaurantId - ID du restaurant
 * @param {Array} data - Données à sauvegarder
 */
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

/**
 * Récupère les données depuis le cache
 * @param {string} restaurantId - ID du restaurant
 * @returns {Object|null} Données du cache ou null
 */
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

    // Vérifier la version du cache
    if (parsedData.version !== CACHE_CONFIG.VERSION) {
      console.log(`🔄 Version du cache obsolète pour restaurant ${restaurantId}, suppression`);
      await clearFoodsCache(restaurantId);
      return null;
    }

    // Vérifier l'expiration
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

/**
 * Supprime le cache pour un restaurant
 * @param {string} restaurantId - ID du restaurant
 */
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

/**
 * Charge les produits avec un cache intelligent
 * 1. Lit d'abord le cache AsyncStorage
 * 2. Affiche immédiatement si disponible
 * 3. Fetch l'API en arrière-plan
 * 4. Met à jour si les données ont changé
 *
 * @param {string} restaurantId - ID du restaurant
 * @param {Function} apiFetcher - Fonction pour fetch l'API
 * @param {Function} onDataLoaded - Callback quand les données sont prêtes (cache ou API)
 * @param {Function} onDataUpdated - Callback quand les données sont mises à jour depuis l'API
 * @param {Function} onLoadingStateChange - Callback pour l'état de chargement
 */
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

    // 1. Essayer de charger depuis le cache
    onLoadingStateChange?.(true);
    const cachedData = await getFoodsFromCache(restaurantId);

    if (cachedData && cachedData.data) {
      console.log('⚡ Données du cache affichées immédiatement');
      onDataLoaded(cachedData.data, true); // true = fromCache
      onLoadingStateChange?.(false);
    } else {
      console.log('📭 Pas de cache disponible, attente des données API');
      onLoadingStateChange?.(true);
    }

    // 2. Fetch l'API en arrière-plan (toujours, même si cache disponible)
    console.log('🌐 Fetch API en arrière-plan...');
    const freshData = await apiFetcher(restaurantId);

    if (freshData && Array.isArray(freshData)) {
      console.log(`📡 Données API reçues: ${freshData.length} produits`);

      // 3. Vérifier si les données ont changé
      const hasChanged = !cachedData || hasDataChanged(cachedData.data, freshData);

      if (hasChanged) {
        console.log('🔄 Données mises à jour, sauvegarde en cache et affichage');

        // Sauvegarder en cache
        await saveFoodsToCache(restaurantId, freshData);

        // Mettre à jour l'affichage
        onDataUpdated(freshData);
      } else {
        console.log('✅ Données identiques, pas de mise à jour nécessaire');
      }
    } else {
      console.warn('⚠️ Données API invalides ou vides');
    }

    // Fin du chargement
    onLoadingStateChange?.(false);

  } catch (error) {
    console.error('❌ Erreur lors du chargement intelligent:', error);
    onLoadingStateChange?.(false);

    // En cas d'erreur, essayer quand même d'utiliser le cache si disponible
    const fallbackCache = await getFoodsFromCache(restaurantId);
    if (fallbackCache && fallbackCache.data) {
      console.log('🔄 Erreur API, utilisation du cache comme fallback');
      onDataLoaded(fallbackCache.data, true);
    }
  }
};

/**
 * Sauvegarde la liste des restaurants en cache
 * @param {Array} restaurants - Liste des restaurants à sauvegarder
 */
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

/**
 * Récupère la liste des restaurants depuis le cache
 * @returns {Object|null} Données du cache ou null
 */
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

    // Vérifier la version du cache
    if (parsedData.version !== CACHE_CONFIG.VERSION) {
      console.log(`🔄 Version du cache des restaurants obsolète, suppression`);
      await clearRestaurantsCache();
      return null;
    }

    // Vérifier l'expiration (même durée que les produits)
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

/**
 * Supprime le cache des restaurants
 */
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

/**
 * Charge les restaurants avec un cache intelligent
 * 1. Lit d'abord le cache AsyncStorage
 * 2. Affiche immédiatement si disponible
 * 3. Fetch l'API en arrière-plan
 * 4. Met à jour si les données ont changé
 *
 * @param {Function} apiFetcher - Fonction pour fetch l'API (getRestaurantsFromFirebase)
 * @param {Function} onDataLoaded - Callback quand les données sont prêtes (cache ou API)
 * @param {Function} onDataUpdated - Callback quand les données sont mises à jour depuis l'API
 * @param {Function} onLoadingStateChange - Callback pour l'état de chargement
 */
export const loadRestaurantsWithSmartCache = async (
  apiFetcher,
  onDataLoaded,
  onDataUpdated,
  onLoadingStateChange
) => {
  try {
    console.log(`🚀 Démarrage du chargement intelligent des restaurants`);

    // 1. Essayer de charger depuis le cache
    onLoadingStateChange?.(true);
    const cachedData = await getRestaurantsFromCache();

    if (cachedData && cachedData.data) {
      console.log('⚡ Restaurants affichés depuis le cache');
      onDataLoaded(cachedData.data, true); // true = fromCache
      onLoadingStateChange?.(false);
    } else {
      console.log('📭 Pas de cache disponible, attente des données API');
      onLoadingStateChange?.(true);
    }

    // 2. Fetch l'API en arrière-plan (toujours, même si cache disponible)
    console.log('🌐 Fetch API en arrière-plan pour les restaurants...');
    const freshData = await apiFetcher();

    if (freshData && Array.isArray(freshData)) {
      console.log(`📡 Restaurants API reçus: ${freshData.length} restaurants`);

      // 3. Vérifier si les données ont changé
      const hasChanged = !cachedData || hasDataChanged(cachedData.data, freshData);

      if (hasChanged) {
        console.log('🔄 Restaurants mis à jour, sauvegarde en cache et affichage');

        // Sauvegarder en cache
        await saveRestaurantsToCache(freshData);

        // Mettre à jour l'affichage
        onDataUpdated(freshData);
      } else {
        console.log('✅ Restaurants identiques, pas de mise à jour nécessaire');
      }
    } else {
      console.warn('⚠️ Données restaurants API invalides ou vides');
    }

    // Fin du chargement
    onLoadingStateChange?.(false);

  } catch (error) {
    console.error('❌ Erreur lors du chargement intelligent des restaurants:', error);
    onLoadingStateChange?.(false);

    // En cas d'erreur, essayer quand même d'utiliser le cache si disponible
    const fallbackCache = await getRestaurantsFromCache();
    if (fallbackCache && fallbackCache.data) {
      console.log('🔄 Erreur API, utilisation du cache comme fallback');
      onDataLoaded(fallbackCache.data, true);
    }
  }
};

/**
 * Sauvegarde les promotions en cache
 * @param {Array} promotions - Liste des promotions à sauvegarder
 */
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

/**
 * Récupère les promotions depuis le cache
 * @returns {Object|null} Données du cache ou null
 */
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

    // Vérifier la version du cache
    if (parsedData.version !== CACHE_CONFIG.VERSION) {
      console.log(`🔄 Version du cache des promotions obsolète, suppression`);
      await clearPromotionsCache();
      return null;
    }

    // Vérifier l'expiration
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

/**
 * Sauvegarde les menus en cache
 * @param {Array} menus - Liste des menus à sauvegarder
 */
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

/**
 * Récupère les menus depuis le cache
 * @returns {Object|null} Données du cache ou null
 */
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

    // Vérifier la version du cache
    if (parsedData.version !== CACHE_CONFIG.VERSION) {
      console.log(`🔄 Version du cache des menus obsolète, suppression`);
      await clearMenusCache();
      return null;
    }

    // Vérifier l'expiration
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

/**
 * Charge les promotions avec un cache intelligent
 * @param {Function} apiFetcher - Fonction pour fetch l'API
 * @param {Function} onDataLoaded - Callback quand les données sont prêtes
 * @param {Function} onDataUpdated - Callback quand les données sont mises à jour
 * @param {Function} onLoadingStateChange - Callback pour l'état de chargement
 */
export const loadPromotionsWithSmartCache = async (
  apiFetcher,
  onDataLoaded,
  onDataUpdated,
  onLoadingStateChange
) => {
  try {
    console.log(`🚀 Démarrage du chargement intelligent des promotions`);

    // 1. Essayer de charger depuis le cache
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

    // 2. Fetch l'API en arrière-plan
    console.log('🌐 Fetch API en arrière-plan pour les promotions...');
    const freshData = await apiFetcher();

    if (freshData && Array.isArray(freshData)) {
      console.log(`📡 Promotions API reçues: ${freshData.length} promotions`);

      // 3. Vérifier si les données ont changé
      const hasChanged = !cachedData || hasDataChanged(cachedData.data, freshData);

      if (hasChanged) {
        console.log('🔄 Promotions mises à jour, sauvegarde en cache');

        // Sauvegarder en cache
        await savePromotionsToCache(freshData);

        // Mettre à jour l'affichage
        onDataUpdated(freshData);
      } else {
        console.log('✅ Promotions identiques, pas de mise à jour nécessaire');
      }
    } else {
      console.warn('⚠️ Données promotions API invalides ou vides');
    }

    // Fin du chargement
    onLoadingStateChange?.(false);

  } catch (error) {
    console.error('❌ Erreur lors du chargement intelligent des promotions:', error);
    onLoadingStateChange?.(false);

    // En cas d'erreur, essayer le cache comme fallback
    const fallbackCache = await getPromotionsFromCache();
    if (fallbackCache && fallbackCache.data) {
      console.log('🔄 Erreur API promotions, utilisation du cache comme fallback');
      onDataLoaded(fallbackCache.data, true);
    }
  }
};

/**
 * Charge les menus avec un cache intelligent
 * @param {Function} apiFetcher - Fonction pour fetch l'API
 * @param {Function} onDataLoaded - Callback quand les données sont prêtes
 * @param {Function} onDataUpdated - Callback quand les données sont mises à jour
 * @param {Function} onLoadingStateChange - Callback pour l'état de chargement
 */
export const loadMenusWithSmartCache = async (
  apiFetcher,
  onDataLoaded,
  onDataUpdated,
  onLoadingStateChange
) => {
  try {
    console.log(`🚀 Démarrage du chargement intelligent des menus`);

    // 1. Essayer de charger depuis le cache
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

    // 2. Fetch l'API en arrière-plan
    console.log('🌐 Fetch API en arrière-plan pour les menus...');
    const freshData = await apiFetcher();

    if (freshData && Array.isArray(freshData)) {
      console.log(`📡 Menus API reçus: ${freshData.length} menus`);

      // 3. Vérifier si les données ont changé
      const hasChanged = !cachedData || hasDataChanged(cachedData.data, freshData);

      if (hasChanged) {
        console.log('🔄 Menus mis à jour, sauvegarde en cache');

        // Sauvegarder en cache
        await saveMenusToCache(freshData);

        // Mettre à jour l'affichage
        onDataUpdated(freshData);
      } else {
        console.log('✅ Menus identiques, pas de mise à jour nécessaire');
      }
    } else {
      console.warn('⚠️ Données menus API invalides ou vides');
    }

    // Fin du chargement
    onLoadingStateChange?.(false);

  } catch (error) {
    console.error('❌ Erreur lors du chargement intelligent des menus:', error);
    onLoadingStateChange?.(false);

    // En cas d'erreur, essayer le cache comme fallback
    const fallbackCache = await getMenusFromCache();
    if (fallbackCache && fallbackCache.data) {
      console.log('🔄 Erreur API menus, utilisation du cache comme fallback');
      onDataLoaded(fallbackCache.data, true);
    }
  }
};

/**
 * Supprime le cache des promotions
 */
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

/**
 * Supprime le cache des menus
 */
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

/**
 * Nettoie tous les caches expirés (fonction de maintenance)
 */
export const cleanupExpiredCache = async () => {
  try {
    console.log('🧹 Nettoyage des caches expirés...');

    const keys = await AsyncStorage.getAllKeys();
    const timestampKeys = keys.filter(key => key.includes(CACHE_KEYS.CACHE_TIMESTAMP));

    let cleanedCount = 0;

    for (const timestampKey of timestampKeys) {
      const timestamp = await AsyncStorage.getItem(timestampKey);

      if (isCacheExpired(parseInt(timestamp))) {
        // Déterminer le type de cache et nettoyer
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

// ==================== FONCTIONS POUR LE CACHE DES INFOS DE CONNEXION ====================

/**
 * Sauvegarde les informations de connexion (email uniquement pour sécurité)
 * @param {string} email - Email de l'utilisateur
 * @param {boolean} rememberMe - Si l'utilisateur veut être mémorisé
 */
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

/**
 * Récupère les informations de connexion sauvegardées
 * @returns {Object|null} Données de connexion ou null
 */
export const getSignInData = async () => {
  try {
    const cachedData = await AsyncStorage.getItem(CACHE_KEYS.USER_SIGNIN_DATA);

    if (!cachedData) {
      console.log('📭 Aucune donnée de connexion en cache');
      return null;
    }

    const parsedData = JSON.parse(cachedData);

    // Vérifier la version du cache
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

/**
 * Supprime les données de connexion sauvegardées
 */
export const clearSignInData = async () => {
  try {
    await AsyncStorage.removeItem(CACHE_KEYS.USER_SIGNIN_DATA);
    console.log('🗑️ Données de connexion supprimées');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression des données de connexion:', error);
  }
};

/**
 * Met à jour l'email dans les données de connexion sauvegardées
 * @param {string} newEmail - Nouveau email
 */
export const updateSignInEmail = async (newEmail) => {
  try {
    if (!newEmail) return;

    const existingData = await getSignInData();

    if (existingData) {
      await saveSignInData(newEmail, existingData.rememberMe);
    } else {
      // Si pas de données existantes, créer avec rememberMe par défaut
      await saveSignInData(newEmail, true);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'email:', error);
  }
};

 