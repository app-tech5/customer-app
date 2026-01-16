// API Client pour remplacer Firebase
import { config } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';
const API_BASE_URL = config.API_BASE_URL;

class ApiClient {
  constructor() {
    this.token = null;
    this.user = null;
    this.initializeFromStorage();
  }

  // Initialisation automatique depuis AsyncStorage
  async initializeFromStorage() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');

      if (token) {
        this.token = token;
      }

      if (userData) {
        this.user = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error initializing from storage:', error);
    }
  }

  // Configuration des headers avec token si disponible
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Méthode générique pour les appels API
  async apiCall(endpoint, options = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const config = {
        headers: this.getHeaders(),
        ...options,
      };

      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Authentification
  async login(email, password) {
    const response = await this.apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      this.token = response.token;
      this.user = response.user;
      await this.saveToStorage();
    }

    return response;
  }

  async register(userData) {
    const response = await this.apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.token) {
      this.token = response.token;
      this.user = response.user;
      await this.saveToStorage();
    }

    return response;
  }

  async logout() {
    this.token = null;
    this.user = null;
    await this.clearStorage();
  }

  // Gestion du stockage local
  async saveToStorage() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      if (this.token) {
        await AsyncStorage.setItem('userToken', this.token);
      }
      if (this.user) {
        await AsyncStorage.setItem('userData', JSON.stringify(this.user));
      }
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  async clearStorage() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  // Utilisateurs
  async getUserInfo(userId) {
    return await this.apiCall(`/users/${userId}`);
  }

  async updateUser(userId, userData) {
    return await this.apiCall(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // GESTION DES FAVORIS

  // Récupérer les favoris de l'utilisateur
  async getFavorites() {
    return await this.apiCall('/users/favorites');
  }

  // Ajouter un restaurant aux favoris
  async addToFavorites(restaurantId) {
    return await this.apiCall(`/users/favorites/${restaurantId}`, {
      method: 'POST',
    });
  }

  // Retirer un restaurant des favoris
  async removeFromFavorites(restaurantId) {
    return await this.apiCall(`/users/favorites/${restaurantId}`, {
      method: 'DELETE',
    });
  }

  // // Restaurants
  // async getRestaurants() {
  //   const response = await this.apiCall('/resource/restaurants');
  //   return response.map(restaurant => ({
  //     restaurantId: restaurant._id || restaurant.id,
  //     ...restaurant,
  //   }));
  // }

  // async getRestaurantById(id) {
  //   return await this.apiCall(`/resource/restaurants/${id}`);
  // }

  // Restaurants
  async getRestaurants() {
    const response = await this.apiCall('/resource/restaurants');
    return response.map(restaurant => this.normalizeRestaurant(restaurant));
  }

  async getRestaurantById(id) {
    const restaurant = await this.apiCall(`/resource/restaurants/${id}`);
    return this.normalizeRestaurant(restaurant);
  }

  // Normalisation centrale
  normalizeRestaurant(restaurant) {
    return {
      restaurantId: restaurant._id || restaurant.id,
      ...restaurant,
    };
  }


  // Catégories
  async getCategories() {
    const response = await this.apiCall('/resource/categories');
    return response.map(category => ({
      id: category._id || category.id,
      ...category,
    }));
  }

  async getCategoriesFromRestaurant(restaurantId) {
    // Récupérer les catégories associées à un restaurant spécifique
    // Pour l'instant, on retourne toutes les catégories
    // TODO: Implémenter une route API qui retourne les catégories par restaurant
    return await this.getCategories();
  }

  async searchRestaurantsByCategory(categoryIdentifier) {
    // Rechercher les restaurants par catégorie (ID ou alias)
    // Pour l'instant, on retourne tous les restaurants
    // TODO: Implémenter une route API qui filtre par catégorie
    const restaurants = await this.getRestaurants();
    // Filtrage temporaire côté client - à remplacer par filtrage côté serveur
    if (categoryIdentifier && restaurants) {
      return restaurants.filter(restaurant =>
        restaurant.categories && restaurant.categories.some(cat =>
          cat._id === categoryIdentifier ||
          cat.id === categoryIdentifier ||
          cat.title === categoryIdentifier ||
          cat === categoryIdentifier
        )
      );
    }
    return restaurants || [];
  }

  // Commandes
  async createOrder(orderData) {
    return await this.apiCall('/resource/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrders() {
    const response = await this.apiCall('/resource/orders');
    return response.map(order => ({
      id: order._id || order.id,
      ...order,
    }));
  }

  async getOrderById(orderId) {
    return await this.apiCall(`/resource/orders/${orderId}`);
  }

  // Drivers
  async getDriverInfo(driverId) {
    return await this.apiCall(`/resource/drivers/${driverId}`);
  }

  // Foods/Menu items
  async getFoods(restaurantId) {
    // Utilisation de la nouvelle route dédiée aux produits avec filtrage d'images
    return await this.apiCall(`/products?type=${restaurantId}`);
  }

  // Reviews
  async getRestaurantReviews(restaurantId) {
    try {
      console.log('🔍 FETCHING REVIEWS for restaurantId:', restaurantId);
      const reviews = await this.apiCall(`/resource/reviews`);
      console.log('🔍 RAW REVIEWS from API:', reviews.length, 'reviews');

      // Filtrer côté frontend les avis approuvés pour ce restaurant
      const filtered = reviews.filter(review => {
        const reviewRestaurantId = review.restaurant?._id || review.restaurant;
        const matchesRestaurant = String(reviewRestaurantId) === String(restaurantId);
        const matchesStatus = review.status === 'approved';

        console.log('🔍 REVIEW FILTER:', {
          reviewId: review._id,
          reviewRestaurant: reviewRestaurantId,
          restaurantId: restaurantId,
          matchesRestaurant,
          status: review.status,
          matchesStatus
        });

        return matchesRestaurant && matchesStatus;
      });

      console.log('🔍 FILTERED REVIEWS:', filtered.length, 'reviews');

      return filtered.sort((a, b) => new Date(b.date) - new Date(a.date)); // Plus récents d'abord
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return []; // Retourner un tableau vide en cas d'erreur
    }
  }

  // Delivery Settings
  async getDeliverySettings() {
    try {
      return await this.apiCall('/resource/deliverysettings');
    } catch (error) {
      console.error('Error fetching delivery settings:', error);
      // Fallback aux valeurs par défaut en cas d'erreur
      return {
        fixedDeliveryFee: 2.5,
        dynamicDeliveryFee: {
          baseFee: 1.5,
          perKmFee: 0.5,
          minFee: 1.5,
          maxFee: 10
        },
        freeDeliveryThreshold: 25,
        deliveryFeeType: 'FIXED'
      };
    }
  }

  // Promotions
  async getAllActiveOffers() {
    try {
      console.log('🔥 FETCHING ALL ACTIVE OFFERS');

      // Récupérer toutes les promotions et tous les restaurants en parallèle
      const [allPromotions, allRestaurants] = await Promise.all([
        this.apiCall('/resource/promotions'),
        this.getRestaurants()
      ]);

      console.log('🔥 ALL PROMOTIONS:', allPromotions.length, 'promotions found');
      console.log('🍽️ ALL RESTAURANTS:', allRestaurants.length, 'restaurants found');

      // Filtrer seulement les promotions actives
      const activePromotions = allPromotions.filter(promotion => {
        const now = new Date();
        const isActive = promotion.isActive &&
          now >= new Date(promotion.startDate) &&
          now <= new Date(promotion.endDate);

        // Vérifier les happy hours si elles existent
        if (promotion.happyHours && promotion.happyHours.length > 0) {
          const currentHour = now.getHours();
          const currentMinutes = now.getMinutes();
          const currentDay = now.getDay();

          const isHappyHour = promotion.happyHours.some(slot => {
            const [startH, startM] = slot.start.split(':').map(Number);
            const [endH, endM] = slot.end.split(':').map(Number);

            const isDayMatch = slot.days.includes(currentDay);
            const isTimeMatch = (
              (currentHour > startH || (currentHour === startH && currentMinutes >= startM)) &&
              (currentHour < endH || (currentHour === endH && currentMinutes <= endM))
            );

            return isDayMatch && isTimeMatch;
          });

          return isActive && isHappyHour;
        }

        return isActive;
      });

      console.log('✅ ACTIVE PROMOTIONS:', activePromotions.length, 'promotions active');

      // Créer une liste des promotions avec les informations d'applicabilité
      const promotionsList = activePromotions.map(promotion => {
        // Compter les restaurants applicables selon le scope
        let applicableRestaurantsCount = 0;
        let applicableRestaurants = [];

        if (promotion.scope === 'restaurant') {
          if (promotion.applicableRestaurants && Array.isArray(promotion.applicableRestaurants)) {
            applicableRestaurants = allRestaurants.filter(restaurant => {
              const restaurantId = restaurant._id || restaurant.restaurantId;
              return promotion.applicableRestaurants.some(restId => {
                const promoRestId = typeof restId === 'object' ? restId.toString() : restId;
                const restIdStr = restaurantId ? restaurantId.toString() : '';
                return promoRestId === restIdStr;
              });
            });
            applicableRestaurantsCount = applicableRestaurants.length;
          }
        } else if (promotion.scope === 'platform') {
          applicableRestaurantsCount = allRestaurants.length;
          applicableRestaurants = allRestaurants.slice(0, 3);
        } else if (promotion.scope === 'category') {
          if (promotion.applicableCategories && Array.isArray(promotion.applicableCategories)) {
            applicableRestaurants = allRestaurants.filter(restaurant => {
              if (!restaurant.categories) return false;

              return restaurant.categories.some(cat => {
                return promotion.applicableCategories.some(promoCat =>
                  cat === promoCat ||
                  cat.name === promoCat ||
                  cat._id === promoCat ||
                  (typeof cat === 'string' && cat === promoCat) ||
                  (cat && cat.toString() === promoCat)
                );
              });
            });
            applicableRestaurantsCount = applicableRestaurants.length;
          }
        } else {
          // Scope inconnu ou item : considérer tous les restaurants
          applicableRestaurantsCount = allRestaurants.length;
          applicableRestaurants = allRestaurants.slice(0, 3);
        }

        // Déterminer le texte d'affichage selon le scope
        let availabilityText = '';
        let availabilityCount = 0;

        if (promotion.scope === 'platform') {
          availabilityText = 'all restaurants';
          availabilityCount = allRestaurants.length;
        } else if (promotion.scope === 'category') {
          const catCount = promotion.applicableCategories?.length || 0;
          availabilityText = `${catCount} categor${catCount > 1 ? 'ies' : 'y'}`;
          availabilityCount = catCount;
        } else if (promotion.scope === 'restaurant') {
          availabilityText = `${applicableRestaurantsCount} restaurant${applicableRestaurantsCount > 1 ? 's' : ''}`;
          availabilityCount = applicableRestaurantsCount;
        } else if (promotion.scope === 'item') {
          // Promotion qui s'applique à des items/produits spécifiques
          const itemCount = promotion.applicableItems?.length || 0;
          availabilityText = `${itemCount} item${itemCount > 1 ? 's' : ''}`;
          availabilityCount = itemCount;
        } else {
          // Scope vraiment inconnu
          availabilityText = 'selected items';
          availabilityCount = 1;
        }

        return {
          id: promotion._id,
          promotion: promotion,
          // Propriétés pour compatibilité avec l'ancien format
          discount_percentage: promotion.promotionType === 'percentage_discount' ? promotion.discountValue : 0,
          free_delivery: promotion.promotionType === 'free_delivery',
          bogo_offer: promotion.promotionType === 'buy_x_get_y',
          flash_deal: promotion.promotionType === 'flash_sale',
          // Informations générales
          name: promotion.name,
          description: promotion.description,
          image_url: promotion.image,
          scope: promotion.scope,
          availabilityText,
          availabilityCount,
          applicableRestaurants: applicableRestaurants.slice(0, 3), // Montrer max 3 restaurants pour preview
          applicableCategories: promotion.applicableCategories,
          applicableItems: promotion.applicableItems,
          // Propriétés de tri
          priority: promotion.priority || 1,
          endDate: promotion.endDate
        };
      });

      console.log('🎯 FINAL PROMOTIONS LIST:', promotionsList.length, 'promotions created');

      return promotionsList;

    } catch (error) {
      console.error('Error fetching all active offers:', error);
      return []; // Retourner un tableau vide en cas d'erreur
    }
  }

  async getRestaurantPromotions(restaurantId) {
    try {
      console.log('🔥 FETCHING PROMOTIONS for restaurant:', restaurantId);

      // Récupérer toutes les promotions actives
      const allPromotions = await this.apiCall('/resource/promotions');

      console.log('🔥 ALL PROMOTIONS:', allPromotions.length, 'promotions found');


      // Filtrer les promotions applicables à ce restaurant
      const restaurantPromotions = allPromotions.filter(promotion => {
        // Vérifier si la promotion est active
        const now = new Date();
        const isActive = promotion.isActive &&
          now >= new Date(promotion.startDate) &&
          now <= new Date(promotion.endDate);


        if (!isActive) return false;

        // UNIQUEMENT les promotions avec scope 'restaurant' ET qui incluent ce restaurant
        const scopeMatch = (() => {
          if (promotion.scope !== 'restaurant') {
            return false; // Exclure tout ce qui n'est pas scope 'restaurant'
          }

          // Vérifier si applicableRestaurants existe et contient l'ID du restaurant
          const hasApplicableRestaurants = promotion.applicableRestaurants &&
            Array.isArray(promotion.applicableRestaurants);
          const includesRestaurantId = hasApplicableRestaurants &&
            promotion.applicableRestaurants.includes(restaurantId);


          return includesRestaurantId;
        })();


        return scopeMatch;
      });



      // Trier par priorité (plus haute en premier) et limiter à 3 max
      return restaurantPromotions
        .sort((a, b) => (b.priority || 1) - (a.priority || 1))
        .slice(0, 3);

    } catch (error) {
      console.error('Error fetching restaurant promotions:', error);
      return []; // Retourner un tableau vide en cas d'erreur
    }
  }

  // Méthodes utilitaires
  setToken(token) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }
}

// Instance globale
export const api = new ApiClient();

// Fonctions d'export pour maintenir la compatibilité avec l'ancien code Firebase
export const auth = {
  currentUser: null,
  signOut: () => api.logout(),
};

export const db = {}; // Placeholder pour les références Firestore
export const storage = {}; // Placeholder pour Storage

// Fonctions de compatibilité Firebase
export const signInWithEmailAndPassword = async (auth, email, password) => {
  const result = await api.login(email, password);
  auth.currentUser = { uid: result.user.id, email: result.user.email };
  return { user: auth.currentUser };
};

export const createUserWithEmailAndPassword = async (auth, email, password) => {
  const result = await api.register({ email, password });
  auth.currentUser = { uid: result.user.id, email: result.user.email };
  return { user: auth.currentUser };
};

export const onAuthStateChanged = (auth, callback) => {
  // Vérifier l'état d'authentification au démarrage
  if (api.user) {
    auth.currentUser = { uid: api.user.id, email: api.user.email };
    callback(auth.currentUser);
  } else {
    callback(null);
  }
};

// Fonctions pour les données (remplacement Firestore)
export const getRestaurantsFromFirebase = () => api.getRestaurants();
export const getCategories = () => api.getCategories();
export const getCategoriesFromRestaurant = (restaurantId) => api.getCategoriesFromRestaurant(restaurantId);
export const searchRestaurantsByCategory = (categoryId) => api.searchRestaurantsByCategory(categoryId);
export const getOrders = () => api.getOrders();
export const getDriverInfos = (driverId) => api.getDriverInfo(driverId);
export const userInfos = (userId) => api.getUserInfo(userId);
export const updateUser = (userData, userId) => api.updateUser(userId, userData);
export const getFoods = (restaurantId) => api.getFoods(restaurantId);

// Récupérer tous les menus depuis la collection menus
export const getAllMenus = async () => {
  try {
    // Récupérer tous les menus via l'API backend
    const response = await fetch(`${API_BASE_URL}/resource/menus`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const menus = await response.json();
    console.log('🍽️ Retrieved', menus.length, 'menus from backend');
    return menus;
  } catch (error) {
    console.error('Error fetching all menus:', error);
    return [];
  }
};
export const getRestaurantReviews = (restaurantId) => api.getRestaurantReviews(restaurantId);
export const getDeliverySettings = () => api.getDeliverySettings();
export const getAllActiveOffers = () => api.getAllActiveOffers();
export const getRestaurantPromotions = (restaurantId) => api.getRestaurantPromotions(restaurantId);

// GESTION DES FAVORIS
export const getFavorites = () => api.getFavorites();

// Récupérer tous les items/plats de tous les restaurants
export const getAllMenuItems = async () => {
  try {
    console.log('🍽️ Fetching all menus from backend...');

    // Récupérer directement tous les menus depuis la collection menus
    const allMenus = await getAllMenus();

    console.log('✅ Retrieved', allMenus.length, 'menus from backend');

    // Transformer les menus pour le format attendu par ItemResults
    const allItems = allMenus.map(menu => ({
      ...menu,
      restaurantId: menu.restaurant || menu.restaurants?.value,
      restaurantName: menu.restaurants?.label,
      // Conserver la référence complète du menu
    }));

    console.log('🍽️ Processed', allItems.length, 'menu items');
    return allItems;
  } catch (error) {
    console.error('Error fetching all menu items:', error);
    return [];
  }
};
export const getRestaurantById = (id) => api.getRestaurantById(id);
export const addToFavorites = (restaurantId) => api.addToFavorites(restaurantId);
export const removeFromFavorites = (restaurantId) => api.removeFromFavorites(restaurantId);

// Collections (placeholders)
export const restaurantsCol = 'restaurants';
export const categoriesCol = 'categories';
export const ordersCol = 'orders';
export const userRef = 'users';

// Exports par défaut
export default api;
