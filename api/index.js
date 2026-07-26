import { ApiClient } from './client';
import './auth';
import './user';
import './favorites';
import './addresses';
import './paymentMethods';
import './payments';
import './wallet';
import './restaurants';
import './foods';
import './reviews';
import './categories';
import './orders';
import './settings';
import './gateways';
import './drivers';
import './deliverySettings';
import './promotions';
import './cart';
import './upload';
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

export const refreshToken = () => api.refreshToken();
export const requestPasswordReset = (email) =>
  api.requestPasswordReset(email);
export const resetPassword = (email, code, newPassword) =>
  api.resetPassword(email, code, newPassword);
export const changePassword = (currentPassword, newPassword) =>
  api.changePassword(currentPassword, newPassword);

export const getRestaurants = () => api.getRestaurants();
export { getRestaurantMongoId } from './restaurants';
export const searchRestaurants = (query) => api.searchRestaurants(query);
export const getNearbyRestaurants = (lat, lng, radiusKm) =>
  api.getNearbyRestaurants(lat, lng, radiusKm);
export const getRestaurantOpeningHours = (restaurantId) =>
  api.getRestaurantOpeningHours(restaurantId);
export const getCategories = () => api.getCategories();
export const getCategoryById = (categoryId) => api.getCategoryById(categoryId);
export const getCategoriesFromRestaurant = (restaurantId) =>
  api.getCategoriesFromRestaurant(restaurantId);
export const searchRestaurantsByCategory = (categoryId) =>
  api.searchRestaurantsByCategory(categoryId);
export const getOrders = () => api.getOrders();
export const getOrderById = (orderId) => api.getOrderById(orderId);
export const updateOrderStatus = (orderId, status) =>
  api.updateOrderStatus(orderId, status);
export const cancelOrder = (orderId) => api.cancelOrder(orderId);
export const getOrderTracking = (orderId) => api.getOrderTracking(orderId);
export const rateOrder = (orderId, rating, comment) =>
  api.rateOrder(orderId, rating, comment);
export const reorder = (orderId) => api.reorder(orderId);
export const getSettings = () => api.getSettings();
export const getGateways = () => api.getGateways();
export const getAppConfig = () => api.getAppConfig();
export const getDriverInfos = (driverId) => api.getDriverInfo(driverId);
export const getDriverLocation = (driverId, orderId) =>
  api.getDriverLocation(driverId, orderId);
export const userInfos = (userId) => api.getUserInfo(userId);
export const getProfile = (userId) => api.getProfile(userId);
export const updateUser = (userData, userId) => api.updateUser(userId, userData);
export const updateProfile = (userId, userData) =>
  api.updateProfile(userId, userData);
export const updateAvatar = (userId, imageUriOrFormData) =>
  api.updateAvatar(userId, imageUriOrFormData);
export const uploadPublicFile = (asset, folder) =>
  api.uploadPublicFile(asset, folder);
export const getFoods = (restaurantId) => api.getFoods(restaurantId);
export const getFoodById = (foodId, restaurantId) =>
  api.getFoodById(foodId, restaurantId);
export const getFoodsByCategory = (restaurantId, categoryId) =>
  api.getFoodsByCategory(restaurantId, categoryId);
export const searchFoods = (restaurantId, query) =>
  api.searchFoods(restaurantId, query);

export { getVariants, getVariantById } from './variants';
export { getAllMenus, getAllMenuItems, getMenusByRestaurant } from './menus';

export const getRestaurantReviews = (restaurantId) =>
  api.getRestaurantReviews(restaurantId);
export const getMyReviews = (userId) => api.getMyReviews(userId);
export const getReviewById = (reviewId) => api.getReviewById(reviewId);
export const createReview = (restaurantId, data) =>
  api.createReview(restaurantId, data);
export const updateReview = (reviewId, data) => api.updateReview(reviewId, data);
export const deleteReview = (reviewId) => api.deleteReview(reviewId);
export const getDeliverySettings = () => api.getDeliverySettings();
export const getRestaurantDeliverySettings = (restaurantId) =>
  api.getRestaurantDeliverySettings(restaurantId);
export const estimateDeliveryFee = (addressId, restaurantId, cartAmount) =>
  api.estimateDeliveryFee(addressId, restaurantId, cartAmount);
export const getAllActiveOffers = () => api.getAllActiveOffers();
export const getAllPromotions = () => api.apiCall('/resource/promotions');
export const getPromotionById = (promotionId) =>
  api.getPromotionById(promotionId);
export const validatePromoCode = (code, restaurantId, cartAmount) =>
  api.validatePromoCode(code, restaurantId, cartAmount);

export { filterRestaurantPromotions };
export const getRestaurantPromotions = (restaurantId, options) =>
  api.getRestaurantPromotions(restaurantId, options);

export const getCart = () => api.getCart();
export const addToCart = (itemData) => api.addToCart(itemData);
export const removeFromCart = (uniqueKey) => api.removeFromCart(uniqueKey);
export const updateCartItem = (uniqueKey, itemData) =>
  api.updateCartItem(uniqueKey, itemData);
export const clearRestaurantFromCart = (restaurantName) =>
  api.clearRestaurantFromCart(restaurantName);
export const clearCart = () => api.clearCart();
export const syncCart = (localItems) => api.syncCart(localItems);
export const getCartCount = () => api.getCartCount();
export const applyPromoCode = (code) => api.applyPromoCode(code);
export const removePromoCode = () => api.removePromoCode();

export const getFavorites = () => api.getFavorites();
export const isFavorite = (restaurantId) => api.isFavorite(restaurantId);

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
export const getAddressById = (userId, addressId) =>
  api.getAddressById(userId, addressId);

export const getUserPaymentMethods = () => api.getUserPaymentMethods();
export const getPaymentMethodById = (paymentMethodId) =>
  api.getPaymentMethodById(paymentMethodId);
export const addPaymentMethod = (paymentMethodData) =>
  api.addPaymentMethod(paymentMethodData);
export const removePaymentMethod = (paymentMethodId) =>
  api.removePaymentMethod(paymentMethodId);
export const setDefaultPaymentMethod = (paymentMethodId) =>
  api.setDefaultPaymentMethod(paymentMethodId);
export const createStripePaymentIntent = (payload) =>
  api.createStripePaymentIntent(payload);
export const attachStripePaymentMethod = (paymentMethodId) =>
  api.attachStripePaymentMethod(paymentMethodId);
export const removeStripePaymentMethod = (paymentMethodId) =>
  api.removeStripePaymentMethod(paymentMethodId);
export const getUserTransactions = () => api.getUserTransactions();
export const addMoneyToWallet = (transactionData) =>
  api.addMoneyToWallet(transactionData);
export const recordOrderPayment = (payload) => api.recordOrderPayment(payload);
export const updatePaymentMethod = (paymentMethodId, paymentMethodData) =>
  api.updatePaymentMethod(paymentMethodId, paymentMethodData);      
export const restaurantsCol = 'restaurants';
export const categoriesCol = 'categories';
export const ordersCol = 'orders';
export const userRef = 'users';

export default api;
