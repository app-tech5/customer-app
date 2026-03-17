import { ApiClient } from './client';

/** Resource: /users/favorites */
ApiClient.prototype.getFavorites = async function () {
  return await this.apiCall('/users/favorites');
};

ApiClient.prototype.addToFavorites = async function (restaurantId) {
  return await this.apiCall(`/users/favorites/${restaurantId}`, { method: 'POST' });
};

ApiClient.prototype.removeFromFavorites = async function (restaurantId) {
  return await this.apiCall(`/users/favorites/${restaurantId}`, { method: 'DELETE' });
};
