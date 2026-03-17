import { ApiClient } from './client';

ApiClient.prototype.getFavorites = async function () {
  return await this.apiCall('/users/favorites');
};

ApiClient.prototype.addToFavorites = async function (restaurantId) {
  return await this.apiCall(`/users/favorites/${restaurantId}`, { method: 'POST' });
};

ApiClient.prototype.removeFromFavorites = async function (restaurantId) {
  return await this.apiCall(`/users/favorites/${restaurantId}`, { method: 'DELETE' });
};

ApiClient.prototype.isFavorite = async function (restaurantId) {
  try {
    const list = await this.getFavorites();
    const ids = (list || []).map((f) => f._id || f.id || f.restaurantId);
    return ids.some((id) => String(id) === String(restaurantId));
  } catch {
    return false;
  }
};
