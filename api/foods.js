import { ApiClient } from './client';

ApiClient.prototype.getFoods = async function (restaurantId) {
  return await this.apiCall(`/products?type=${restaurantId}`);
};

ApiClient.prototype.getFoodById = async function (foodId, restaurantId) {
  try {
    const endpoint = restaurantId
      ? `/products/${foodId}?restaurantId=${restaurantId}`
      : `/products/${foodId}`;
    return await this.apiCall(endpoint);
  } catch (error) {
    console.error('Error fetching food by id:', error);
    return null;
  }
};

ApiClient.prototype.getFoodsByCategory = async function (restaurantId, categoryId) {
  const foods = await this.getFoods(restaurantId);
  if (!Array.isArray(foods) || !categoryId) return foods || [];
  return foods.filter(
    (f) =>
      f.category === categoryId ||
      f.categoryId === categoryId ||
      (f.category && (f.category._id === categoryId || f.category.id === categoryId))
  );
};

ApiClient.prototype.searchFoods = async function (restaurantId, query) {
  const foods = await this.getFoods(restaurantId);
  if (!Array.isArray(foods) || !query?.trim()) return foods || [];
  const q = query.trim().toLowerCase();
  return foods.filter(
    (f) =>
      (f.name && f.name.toLowerCase().includes(q)) ||
      (f.title && f.title.toLowerCase().includes(q)) ||
      (f.description && f.description.toLowerCase().includes(q))
  );
};
