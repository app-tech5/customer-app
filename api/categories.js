import { ApiClient } from './client';

/** Resource: /resource/categories */
ApiClient.prototype.getCategories = async function () {
  const response = await this.apiCall('/resource/categories');
  return response.map((category) => ({
    id: category._id || category.id,
    ...category,
  }));
};

ApiClient.prototype.getCategoriesFromRestaurant = async function (restaurantId) {
  return await this.getCategories();
};

ApiClient.prototype.searchRestaurantsByCategory = async function (categoryIdentifier) {
  const restaurants = await this.getRestaurants();
  if (categoryIdentifier && restaurants) {
    return restaurants.filter((restaurant) =>
      restaurant.categories?.some(
        (cat) =>
          cat._id === categoryIdentifier ||
          cat.id === categoryIdentifier ||
          cat.title === categoryIdentifier ||
          cat === categoryIdentifier
      )
    );
  }
  return restaurants || [];
};
