import { ApiClient } from './client';

ApiClient.prototype.getCart = async function () {
  return await this.apiCall('/cart');
};

ApiClient.prototype.addToCart = async function (itemData) {
  return await this.apiCall('/cart/items', {
    method: 'POST',
    body: JSON.stringify(itemData),
  });
};

ApiClient.prototype.removeFromCart = async function (itemId) {
  return await this.apiCall(`/cart/items/${itemId}`, { method: 'DELETE' });
};

ApiClient.prototype.updateCartItem = async function (itemId, itemData) {
  return await this.apiCall(`/cart/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(itemData),
  });
};

ApiClient.prototype.clearRestaurantFromCart = async function (restaurantName) {
  return await this.apiCall(
    `/cart/restaurant/${encodeURIComponent(restaurantName)}`,
    { method: 'DELETE' }
  );
};

ApiClient.prototype.clearCart = async function () {
  return await this.apiCall('/cart', { method: 'DELETE' });
};

ApiClient.prototype.syncCart = async function (localItems) {
  return await this.apiCall('/cart/sync', {
    method: 'POST',
    body: JSON.stringify({ localItems }),
  });
};

ApiClient.prototype.getCartCount = async function () {
  try {
    const cart = await this.getCart();
    const items = cart?.items || cart?.localItems || [];
    return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  } catch {
    return 0;
  }
};

ApiClient.prototype.applyPromoCode = async function (code) {
  return await this.apiCall('/cart/promo', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
};

ApiClient.prototype.removePromoCode = async function () {
  return await this.apiCall('/cart/promo', { method: 'DELETE' });
};
