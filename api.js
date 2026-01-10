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
    // Dans le nouveau système, les plats peuvent être dans une collection séparée
    // ou associés aux restaurants via une relation
    return await this.apiCall(`/resource/products?restaurantId=${restaurantId}`);
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
export const getOrders = () => api.getOrders();
export const getDriverInfos = (driverId) => api.getDriverInfo(driverId);
export const userInfos = (userId) => api.getUserInfo(userId);
export const updateUser = (userData, userId) => api.updateUser(userId, userData);
export const getFoods = (restaurantId) => api.getFoods(restaurantId);

// Collections (placeholders)
export const restaurantsCol = 'restaurants';
export const categoriesCol = 'categories';
export const ordersCol = 'orders';
export const userRef = 'users';

// Exports par défaut
export default api;
