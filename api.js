
import { config } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';
const API_BASE_URL = config.API_BASE_URL;

class ApiClient {
  constructor() {
    this.token = null;
    this.user = null;
    this.initializeFromStorage();
  }
  
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
  
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }
  
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
  
  async getUserInfo(userId) {
    return await this.apiCall(`/users/${userId}`);
  }

  async updateUser(userId, userData) {
    return await this.apiCall(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }
  
  async getFavorites() {
    return await this.apiCall('/users/favorites');
  }
  
  async addToFavorites(restaurantId) {
    return await this.apiCall(`/users/favorites/${restaurantId}`, {
      method: 'POST',
    });
  }
  
  async removeFromFavorites(restaurantId) {
    return await this.apiCall(`/users/favorites/${restaurantId}`, {
      method: 'DELETE',
    });
  }
  
  async getUserAddresses(userId) {
    return await this.apiCall(`/users/${userId}/addresses`);
  }
  
  async addUserAddress(userId, addressData) {
    return await this.apiCall(`/users/${userId}/addresses`, {
      method: 'POST',
      body: JSON.stringify(addressData),
    });
  }
  
  async updateUserAddress(userId, addressId, addressData) {
    return await this.apiCall(`/users/${userId}/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(addressData),
    });
  }
  
  async deleteUserAddress(userId, addressId) {
    return await this.apiCall(`/users/${userId}/addresses/${addressId}`, {
      method: 'DELETE',
    });
  }
  
  async setDefaultAddress(userId, addressId) {
    return await this.apiCall(`/users/${userId}/addresses/${addressId}/default`, {
      method: 'PUT',
    });
  }
  
  async getUserPaymentMethods(userId) {
    return await this.apiCall(`/users/${userId}/payment-methods`);
  }
  
  async addPaymentMethod(userId, paymentMethodData) {
    return await this.apiCall(`/users/${userId}/payment-methods`, {
      method: 'POST',
      body: JSON.stringify(paymentMethodData),
    });
  }
  
  async removePaymentMethod(userId, paymentMethodId) {
    return await this.apiCall(`/users/${userId}/payment-methods/${paymentMethodId}`, {
      method: 'DELETE',
    });
  }
  
  async setDefaultPaymentMethod(userId, paymentMethodId) {
    return await this.apiCall(`/users/${userId}/payment-methods/${paymentMethodId}/default`, {
      method: 'PUT',
    });
  }
  
  async getUserTransactions(userId, page = 1, limit = 20) {
    return await this.apiCall(`/users/${userId}/transactions?page=${page}&limit=${limit}`);
  }
  
  async getWalletBalance(userId) {
    return await this.apiCall(`/users/${userId}/wallet/balance`);
  }
  
  async addMoneyToWallet(userId, amount, paymentMethodId) {
    return await this.apiCall(`/users/${userId}/wallet/add-money`, {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethodId }),
    });
  }
  
  async withdrawFromWallet(userId, amount, paymentMethodId) {
    return await this.apiCall(`/users/${userId}/wallet/withdraw`, {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethodId }),
    });
  }
  
  async getRestaurants() {
    const response = await this.apiCall('/resource/restaurants');
    return response.map(restaurant => this.normalizeRestaurant(restaurant));
  }

  async getRestaurantById(id) {
    const restaurant = await this.apiCall(`/resource/restaurants/${id}`);
    return this.normalizeRestaurant(restaurant);
  }
  
  normalizeRestaurant(restaurant) {
    return {
      restaurantId: restaurant._id || restaurant.id,
      ...restaurant,
    };
  }
  
  async getCategories() {
    const response = await this.apiCall('/resource/categories');
    return response.map(category => ({
      id: category._id || category.id,
      ...category,
    }));
  }

  async getCategoriesFromRestaurant(restaurantId) {
    
    return await this.getCategories();
  }

  async searchRestaurantsByCategory(categoryIdentifier) {
    
    const restaurants = await this.getRestaurants();
    
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

  async getSettings() {
    const response = await this.apiCall('/resource/settings');
    return response;
  }

  async getOrderById(orderId) {
    return await this.apiCall(`/resource/orders/${orderId}`);
  }

  async updateOrderStatus(orderId, status) {
    return await this.apiCall(`/resource/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async cancelOrder(orderId) {
    return await this.updateOrderStatus(orderId, 'cancelled');
  }
  
  async getDriverInfo(driverId) {
    return await this.apiCall(`/resource/drivers/${driverId}`);
  }
  
  async getFoods(restaurantId) {
    
    return await this.apiCall(`/products?type=${restaurantId}`);
  }
  
  async getRestaurantReviews(restaurantId) {
    try {
      
      const reviews = await this.apiCall(`/resource/reviews`);
      
      const filtered = reviews.filter(review => {
        const reviewRestaurantId = review.restaurant?._id || review.restaurant;
        const matchesRestaurant = String(reviewRestaurantId) === String(restaurantId);
        const matchesStatus = review.status === 'approved';

        return matchesRestaurant && matchesStatus;
      });

      return filtered.sort((a, b) => new Date(b.date) - new Date(a.date)); 
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return []; 
    }
  }
  
  async getDeliverySettings() {
    try {
      return await this.apiCall('/resource/deliverysettings');
    } catch (error) {
      console.error('Error fetching delivery settings:', error);
      
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
  
  async getAllActiveOffers() {
    try {
      
      const [allPromotions, allRestaurants] = await Promise.all([
        this.apiCall('/resource/promotions'),
        this.getRestaurants()
      ]);
      
      const activePromotions = allPromotions.filter(promotion => {
        const now = new Date();
        const isActive = promotion.isActive &&
          now >= new Date(promotion.startDate) &&
          now <= new Date(promotion.endDate);
        
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
      
      const promotionsList = activePromotions.map(promotion => {
        
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
          
          applicableRestaurantsCount = allRestaurants.length;
          applicableRestaurants = allRestaurants.slice(0, 3);
        }
        
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
          
          const itemCount = promotion.applicableItems?.length || 0;
          availabilityText = `${itemCount} item${itemCount > 1 ? 's' : ''}`;
          availabilityCount = itemCount;
        } else {
          
          availabilityText = 'selected items';
          availabilityCount = 1;
        }

        return {
          id: promotion._id,
          promotion: promotion,
          
          discount_percentage: promotion.promotionType === 'percentage_discount' ? promotion.discountValue : 0,
          free_delivery: promotion.promotionType === 'free_delivery',
          bogo_offer: promotion.promotionType === 'buy_x_get_y',
          flash_deal: promotion.promotionType === 'flash_sale',
          
          name: promotion.name,
          description: promotion.description,
          image_url: promotion.image,
          scope: promotion.scope,
          availabilityText,
          availabilityCount,
          applicableRestaurants: applicableRestaurants.slice(0, 3), 
          applicableCategories: promotion.applicableCategories,
          applicableItems: promotion.applicableItems,
          
          priority: promotion.priority || 1,
          endDate: promotion.endDate
        };
      });

      return promotionsList;

    } catch (error) {
      console.error('Error fetching all active offers:', error);
      return []; 
    }
  }

  async getRestaurantPromotions(restaurantId) {
    try {
      
      const [allPromotions, allMenus] = await Promise.all([
        this.apiCall('/resource/promotions'),
        getAllMenus() 
      ]);
      
      const restaurantMenuIds = new Set(
        allMenus
          .filter(menu => {
            
            const menuRestaurantId = menu.restaurant || menu.restaurants?.value;
            const restaurantIdStr = restaurantId.toString();
            const menuRestaurantIdStr = typeof menuRestaurantId === 'object'
              ? (menuRestaurantId?._id || menuRestaurantId?.toString())
              : menuRestaurantId?.toString();

            return menuRestaurantIdStr === restaurantIdStr;
          })
          .map(menu => {
            const menuId = menu._id || menu.id;
            return menuId ? menuId.toString() : null;
          })
          .filter(Boolean)
      );
      
      const restaurantPromotions = filterPromotionsByRestaurant(allPromotions, restaurantId, restaurantMenuIds);
      
      return restaurantPromotions
        .sort((a, b) => (b.priority || 1) - (a.priority || 1))
        .slice(0, 3);

    } catch (error) {
      console.error('Error fetching restaurant promotions:', error);
      return []; 
    }
  }
  
  async getCart() {
    return await this.apiCall('/cart');
  }

  async addToCart(itemData) {
    return await this.apiCall('/cart/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async removeFromCart(itemId) {
    return await this.apiCall(`/cart/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async updateCartItem(itemId, itemData) {
    return await this.apiCall(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  }

  async clearRestaurantFromCart(restaurantName) {
    return await this.apiCall(`/cart/restaurant/${encodeURIComponent(restaurantName)}`, {
      method: 'DELETE',
    });
  }

  async clearCart() {
    return await this.apiCall('/cart', {
      method: 'DELETE',
    });
  }

  async syncCart(localItems) {
    return await this.apiCall('/cart/sync', {
      method: 'POST',
      body: JSON.stringify({ localItems }),
    });
  }
  
  setToken(token) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }
}

export const api = new ApiClient();

export const auth = {
  currentUser: null,
  signOut: () => api.logout(),
};

export const db = {}; 
export const storage = {}; 

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
  
  if (api.user) {
    auth.currentUser = { uid: api.user.id, email: api.user.email };
    callback(auth.currentUser);
  } else {
    callback(null);
  }
};

export const getRestaurants = () => api.getRestaurants();
export const getCategories = () => api.getCategories();
export const getCategoriesFromRestaurant = (restaurantId) => api.getCategoriesFromRestaurant(restaurantId);
export const searchRestaurantsByCategory = (categoryId) => api.searchRestaurantsByCategory(categoryId);
export const getOrders = () => api.getOrders();
export const getOrderById = (orderId) => api.getOrderById(orderId);
export const updateOrderStatus = (orderId, status) => api.updateOrderStatus(orderId, status);
export const cancelOrder = (orderId) => api.cancelOrder(orderId);
export const getSettings = () => api.getSettings();
export const getDriverInfos = (driverId) => api.getDriverInfo(driverId);
export const userInfos = (userId) => api.getUserInfo(userId);
export const updateUser = (userData, userId) => api.updateUser(userId, userData);
export const getFoods = (restaurantId) => api.getFoods(restaurantId);

export const getVariants = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/resource/variants`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des variants:', error);
    return [];
  }
};

export const getAllMenus = async () => {
  try {
    
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
    
    return menus;
  } catch (error) {
    console.error('Error fetching all menus:', error);
    return [];
  }
};
export const getRestaurantReviews = (restaurantId) => api.getRestaurantReviews(restaurantId);
export const getDeliverySettings = () => api.getDeliverySettings();
export const getAllActiveOffers = () => api.getAllActiveOffers();

export const getAllPromotions = () => api.apiCall('/resource/promotions');

const calculateRestaurantMenuIds = (allMenus, restaurantId) => {
  return new Set(
    allMenus
      .filter(menu => {
        const menuRestaurantId = menu.restaurant || menu.restaurants?.value;
        const restaurantIdStr = restaurantId.toString();
        const menuRestaurantIdStr = typeof menuRestaurantId === 'object'
          ? (menuRestaurantId?._id || menuRestaurantId?.toString())
          : menuRestaurantId?.toString();

        return menuRestaurantIdStr === restaurantIdStr;
      })
      .map(menu => {
        const menuId = menu._id || menu.id;
        return menuId ? menuId.toString() : null;
      })
      .filter(Boolean)
  );
};

const filterPromotionsByRestaurant = (allPromotions, restaurantId, restaurantMenuIds) => {
  return allPromotions.filter(promotion => {
    
    const now = new Date();
    const isActive = promotion.isActive &&
      now >= new Date(promotion.startDate) &&
      now <= new Date(promotion.endDate);

    if (!isActive) return false;
    
    const scopeMatch = (() => {
      
      if (promotion.scope === 'restaurant') {
        const hasApplicableRestaurants = promotion.applicableRestaurants &&
          Array.isArray(promotion.applicableRestaurants);

        if (hasApplicableRestaurants) {
          const restaurantIdStr = restaurantId.toString();
          const includesRestaurantId = promotion.applicableRestaurants.some(restId => {
            const promoRestId = typeof restId === 'object' ? (restId._id || restId.toString()) : restId;
            return promoRestId.toString() === restaurantIdStr;
          });

          if (includesRestaurantId) {
            
            return true;
          }
        }
        return false;
      }
      
      if (promotion.scope === 'item') {
        const hasApplicableItems = promotion.applicableItems &&
          Array.isArray(promotion.applicableItems);

        if (hasApplicableItems && restaurantMenuIds.size > 0) {
          const hasMatchingItem = promotion.applicableItems.some(itemId => {
            const promoItemId = typeof itemId === 'object' ? (itemId._id || itemId.toString()) : itemId;
            const promoItemIdStr = promoItemId ? promoItemId.toString() : '';
            return restaurantMenuIds.has(promoItemIdStr);
          });

          if (hasMatchingItem) {
            
            return true;
          }
        }
        return false;
      }
      
      if (promotion.scope === 'platform') {
        
        return true;
      }
      
      if (promotion.scope === 'category') {
        
        return false;
      }

      return false;
    })();

    return scopeMatch;
  });
};

export const filterRestaurantPromotions = (allPromotions, restaurantId, allMenus = null) => {
  if (!allPromotions || !Array.isArray(allPromotions) || !restaurantId) {
    return [];
  }
  
  const restaurantMenuIds = allMenus ? calculateRestaurantMenuIds(allMenus, restaurantId) : new Set();
  
  const restaurantPromotions = filterPromotionsByRestaurant(allPromotions, restaurantId, restaurantMenuIds);
  
  return restaurantPromotions
    .sort((a, b) => (b.priority || 1) - (a.priority || 1))
    .slice(0, 3);
};

export const getRestaurantPromotions = (restaurantId) => api.getRestaurantPromotions(restaurantId);

export const getCart = () => api.getCart();
export const addToCart = (itemData) => api.addToCart(itemData);
export const removeFromCart = (uniqueKey) => api.removeFromCart(uniqueKey);
export const updateCartItem = (uniqueKey, itemData) => api.updateCartItem(uniqueKey, itemData);
export const clearRestaurantFromCart = (restaurantName) => api.clearRestaurantFromCart(restaurantName);
export const clearCart = () => api.clearCart();
export const syncCart = (localItems) => api.syncCart(localItems);

export const getFavorites = () => api.getFavorites();

export const getAllMenuItems = async () => {
  try {
    
    const allMenus = await getAllMenus();
    
    const allItems = allMenus.map(menu => ({
      ...menu,
      restaurantId: menu.restaurant || menu.restaurants?.value,
      restaurantName: menu.restaurants?.label,
      
    }));
    
    return allItems;
  } catch (error) {
    console.error('Error fetching all menu items:', error);
    return [];
  }
};
export const getRestaurantById = (id) => api.getRestaurantById(id);
export const addToFavorites = (restaurantId) => api.addToFavorites(restaurantId);
export const removeFromFavorites = (restaurantId) => api.removeFromFavorites(restaurantId);

export const getUserAddresses = (userId) => api.getUserAddresses(userId);
export const addUserAddress = (userId, addressData) => api.addUserAddress(userId, addressData);
export const updateUserAddress = (userId, addressId, addressData) => api.updateUserAddress(userId, addressId, addressData);
export const deleteUserAddress = (userId, addressId) => api.deleteUserAddress(userId, addressId);
export const setDefaultAddress = (userId, addressId) => api.setDefaultAddress(userId, addressId);

export const getUserPaymentMethods = (userId) => api.getUserPaymentMethods(userId);
export const addPaymentMethod = (userId, paymentMethodData) => api.addPaymentMethod(userId, paymentMethodData);
export const removePaymentMethod = (userId, paymentMethodId) => api.removePaymentMethod(userId, paymentMethodId);
export const setDefaultPaymentMethod = (userId, paymentMethodId) => api.setDefaultPaymentMethod(userId, paymentMethodId);
export const getUserTransactions = (userId, page, limit) => api.getUserTransactions(userId, page, limit);
export const getWalletBalance = (userId) => api.getWalletBalance(userId);
export const addMoneyToWallet = (userId, amount, paymentMethodId) => api.addMoneyToWallet(userId, amount, paymentMethodId);
export const withdrawFromWallet = (userId, amount, paymentMethodId) => api.withdrawFromWallet(userId, amount, paymentMethodId);

export const restaurantsCol = 'restaurants';
export const categoriesCol = 'categories';
export const ordersCol = 'orders';
export const userRef = 'users';

export default api;
