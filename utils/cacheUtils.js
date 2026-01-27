import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys
const CACHE_KEYS = {
  RESTAURANT_FOODS: 'restaurant_foods_',
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
        const restaurantId = timestampKey.replace(CACHE_KEYS.RESTAURANT_FOODS, '').replace(CACHE_KEYS.CACHE_TIMESTAMP, '');
        await clearFoodsCache(restaurantId);
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

 