// API Client pour remplacer Firebase
import { config } from './config';
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

  // Restaurants
  async getRestaurants() {
    const response = await this.apiCall('/resource/restaurants');
    return response.map(restaurant => ({
      restaurantId: restaurant._id || restaurant.id,
      ...restaurant,
    }));
  }

  async getRestaurantById(id) {
    return await this.apiCall(`/resource/restaurants/${id}`);
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

  async searchRestaurantsByCategory(categoryId) {
    // Rechercher les restaurants par catégorie
    // Pour l'instant, on retourne tous les restaurants
    // TODO: Implémenter une route API qui filtre par catégorie
    const restaurants = await this.getRestaurants();
    // Filtrage temporaire côté client - à remplacer par filtrage côté serveur
    if (categoryId && restaurants) {
      return restaurants.filter(restaurant =>
        restaurant.categories && restaurant.categories.some(cat =>
          cat._id === categoryId || cat.id === categoryId || cat === categoryId
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
export const getRestaurantReviews = (restaurantId) => api.getRestaurantReviews(restaurantId);
export const getDeliverySettings = () => api.getDeliverySettings();
export const getRestaurantPromotions = (restaurantId) => api.getRestaurantPromotions(restaurantId);

// GESTION DES FAVORIS
export const getFavorites = () => api.getFavorites();
export const addToFavorites = (restaurantId) => api.addToFavorites(restaurantId);
export const removeFromFavorites = (restaurantId) => api.removeFromFavorites(restaurantId);

// Collections (placeholders)
export const restaurantsCol = 'restaurants';
export const categoriesCol = 'categories';
export const ordersCol = 'orders';
export const userRef = 'users';

// Exports par défaut
export default api;
