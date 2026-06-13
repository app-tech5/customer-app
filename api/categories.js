import { ApiClient } from './client';

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
    const identifier = String(categoryIdentifier);

    return restaurants.filter((restaurant) =>
      restaurant.categories?.some((cat) => {
        if (typeof cat === 'string') {
          return cat === categoryIdentifier;
        }

        const categoryValue = cat.value?._id || cat.value?.id || cat.value;

        return (
          cat._id === categoryIdentifier ||
          cat.id === categoryIdentifier ||
          String(categoryValue) === identifier ||
          cat.title === categoryIdentifier ||
          cat.name === categoryIdentifier ||
          cat.label === categoryIdentifier ||
          cat === categoryIdentifier
        );
      })
    );
  }
  return restaurants || [];
};

ApiClient.prototype.getCategoryById = async function (categoryId) {
  try {
    return await this.apiCall(`/resource/categories/${categoryId}`);
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
};
