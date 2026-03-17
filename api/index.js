import { ApiClient } from './client';
import './auth';
import './user';
import './favorites';
import './addresses';
import './paymentMethods';
import './wallet';
import './restaurants';
import './categories';
import './orders';
import './deliverySettings';
import './promotions';
import './offers';
import './cart';
import { filterRestaurantPromotions } from './promotions';

export const api = new ApiClient();

export const auth = {
  currentUser: null,
  signOut: () => api.logout(),
};

export const db = {};
export const storage = {};

export const signInWithEmailAndPassword = async (authInstance, email, password) => {
  const result = await api.login(email, password);
  authInstance.currentUser = { uid: result.user.id, email: result.user.email };
  return { user: authInstance.currentUser };
};

export const createUserWithEmailAndPassword = async (authInstance, email, password) => {
  const result = await api.register({ email, password });
  authInstance.currentUser = { uid: result.user.id, email: result.user.email };
  return { user: authInstance.currentUser };
};

export const onAuthStateChanged = (authInstance, callback) => {
  if (api.user) {
    authInstance.currentUser = { uid: api.user.id, email: api.user.email };
    callback(authInstance.currentUser);
  } else {
    callback(null);
  }
};

export const getRestaurants = () => api.getRestaurants();
export const getCategories = () => api.getCategories();
export const getCategoriesFromRestaurant = (restaurantId) =>
  api.getCategoriesFromRestaurant(restaurantId);
export const searchRestaurantsByCategory = (categoryId) =>
  api.searchRestaurantsByCategory(categoryId);
export const getOrders = () => api.getOrders();
export const getOrderById = (orderId) => api.getOrderById(orderId);
export const updateOrderStatus = (orderId, status) =>
  api.updateOrderStatus(orderId, status);
export const cancelOrder = (orderId) => api.cancelOrder(orderId);
export const getSettings = () => api.getSettings();
export const getDriverInfos = (driverId) => api.getDriverInfo(driverId);
export const userInfos = (userId) => api.getUserInfo(userId);
export const updateUser = (userData, userId) => api.updateUser(userId, userData);
export const getFoods = (restaurantId) => api.getFoods(restaurantId);

export { getVariants } from './variants';
export { getAllMenus, getAllMenuItems } from './menus';

export const getRestaurantReviews = (restaurantId) =>
  api.getRestaurantReviews(restaurantId);
export const getDeliverySettings = () => api.getDeliverySettings();
export const getAllActiveOffers = () => api.getAllActiveOffers();
export const getAllPromotions = () => api.apiCall('/resource/promotions');

export { filterRestaurantPromotions };
export const getRestaurantPromotions = (restaurantId) =>
  api.getRestaurantPromotions(restaurantId);

export const getCart = () => api.getCart();
export const addToCart = (itemData) => api.addToCart(itemData);
export const removeFromCart = (uniqueKey) => api.removeFromCart(uniqueKey);
export const updateCartItem = (uniqueKey, itemData) =>
  api.updateCartItem(uniqueKey, itemData);
export const clearRestaurantFromCart = (restaurantName) =>
  api.clearRestaurantFromCart(restaurantName);
export const clearCart = () => api.clearCart();
export const syncCart = (localItems) => api.syncCart(localItems);

export const getFavorites = () => api.getFavorites();

export const createOrder = (orderData) => api.createOrder(orderData);
export const getRestaurantById = (id) => api.getRestaurantById(id);
export const addToFavorites = (restaurantId) => api.addToFavorites(restaurantId);
export const removeFromFavorites = (restaurantId) =>
  api.removeFromFavorites(restaurantId);

export const getUserAddresses = (userId) => api.getUserAddresses(userId);
export const addUserAddress = (userId, addressData) =>
  api.addUserAddress(userId, addressData);
export const updateUserAddress = (userId, addressId, addressData) =>
  api.updateUserAddress(userId, addressId, addressData);
export const deleteUserAddress = (userId, addressId) =>
  api.deleteUserAddress(userId, addressId);
export const setDefaultAddress = (userId, addressId) =>
  api.setDefaultAddress(userId, addressId);

export const getUserPaymentMethods = (userId) =>
  api.getUserPaymentMethods(userId);
export const addPaymentMethod = (userId, paymentMethodData) =>
  api.addPaymentMethod(userId, paymentMethodData);
export const removePaymentMethod = (userId, paymentMethodId) =>
  api.removePaymentMethod(userId, paymentMethodId);
export const setDefaultPaymentMethod = (userId, paymentMethodId) =>
  api.setDefaultPaymentMethod(userId, paymentMethodId);
export const getUserTransactions = (userId, page, limit) =>
  api.getUserTransactions(userId, page, limit);
export const getWalletBalance = (userId) => api.getWalletBalance(userId);
export const addMoneyToWallet = (userId, amount, paymentMethodId) =>
  api.addMoneyToWallet(userId, amount, paymentMethodId);
export const withdrawFromWallet = (userId, amount, paymentMethodId) =>
  api.withdrawFromWallet(userId, amount, paymentMethodId);

export const restaurantsCol = 'restaurants';
export const categoriesCol = 'categories';
export const ordersCol = 'orders';
export const userRef = 'users';

export default api;
