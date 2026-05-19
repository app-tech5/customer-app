import { ApiClient } from './client';

ApiClient.prototype.getRestaurants = async function () {
  const response = await this.apiCall('/resource/restaurants');
  return response
    .map((restaurant) => this.normalizeRestaurant(restaurant))
    .filter((restaurant) => restaurant.isActivated === true);
};

ApiClient.prototype.getRestaurantById = async function (id) {
  const restaurant = await this.apiCall(`/resource/restaurants/${id}`);
  const normalized = this.normalizeRestaurant(restaurant);
  if (normalized.isActivated !== true) {
    throw new Error('Restaurant not available');
  }
  return normalized;
};

ApiClient.prototype.normalizeRestaurant = function (restaurant) {
  return {
    restaurantId: restaurant._id || restaurant.id,
    ...restaurant,
  };
};

ApiClient.prototype.searchRestaurants = async function (query) {
  if (!query || !query.trim()) return await this.getRestaurants();
  const restaurants = await this.getRestaurants();
  const q = query.trim().toLowerCase();
  return restaurants.filter(
    (r) =>
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q))
  );
};

ApiClient.prototype.getNearbyRestaurants = async function (lat, lng, radiusKm = 10) {
  return await this.apiCall(
    `/resource/restaurants/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`
  );
};

ApiClient.prototype.getRestaurantOpeningHours = async function (restaurantId) {
  try {
    return await this.apiCall(`/resource/restaurants/${restaurantId}/opening-hours`);
  } catch (error) {
    console.error('Error fetching opening hours:', error);
    return null;
  }
};
