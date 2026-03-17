import { ApiClient } from './client';

/** Resource: /resource/restaurants, /products, /resource/reviews */
ApiClient.prototype.getRestaurants = async function () {
  const response = await this.apiCall('/resource/restaurants');
  return response.map((restaurant) => this.normalizeRestaurant(restaurant));
};

ApiClient.prototype.getRestaurantById = async function (id) {
  const restaurant = await this.apiCall(`/resource/restaurants/${id}`);
  return this.normalizeRestaurant(restaurant);
};

ApiClient.prototype.normalizeRestaurant = function (restaurant) {
  return {
    restaurantId: restaurant._id || restaurant.id,
    ...restaurant,
  };
};

ApiClient.prototype.getFoods = async function (restaurantId) {
  return await this.apiCall(`/products?type=${restaurantId}`);
};

ApiClient.prototype.getRestaurantReviews = async function (restaurantId) {
  try {
    const reviews = await this.apiCall('/resource/reviews');
    const filtered = reviews.filter((review) => {
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
};
