import { ApiClient } from './client';
import { getAllMenus } from './menus';
import {
  calculateRestaurantMenuIds,
  filterPromotionsByRestaurant,
} from './promotionsHelpers';

/** Resource: /resource/promotions (filtered by restaurant) */

export function filterRestaurantPromotions(
  allPromotions,
  restaurantId,
  allMenus = null
) {
  if (!allPromotions || !Array.isArray(allPromotions) || !restaurantId) return [];
  const restaurantMenuIds = allMenus
    ? calculateRestaurantMenuIds(allMenus, restaurantId)
    : new Set();
  const restaurantPromotions = filterPromotionsByRestaurant(
    allPromotions,
    restaurantId,
    restaurantMenuIds
  );
  return restaurantPromotions
    .sort((a, b) => (b.priority || 1) - (a.priority || 1))
    .slice(0, 3);
}

ApiClient.prototype.getRestaurantPromotions = async function (restaurantId) {
  try {
    const [allPromotions, allMenus] = await Promise.all([
      this.apiCall('/resource/promotions'),
      getAllMenus(),
    ]);

    const restaurantMenuIds = new Set(
      allMenus
        .filter((menu) => {
          const menuRestaurantId = menu.restaurant || menu.restaurants?.value;
          const restaurantIdStr = restaurantId.toString();
          const menuRestaurantIdStr =
            typeof menuRestaurantId === 'object'
              ? (menuRestaurantId?._id || menuRestaurantId?.toString())
              : menuRestaurantId?.toString();
          return menuRestaurantIdStr === restaurantIdStr;
        })
        .map((menu) => {
          const menuId = menu._id || menu.id;
          return menuId ? menuId.toString() : null;
        })
        .filter(Boolean)
    );

    const restaurantPromotions = filterPromotionsByRestaurant(
      allPromotions,
      restaurantId,
      restaurantMenuIds
    );
    return restaurantPromotions
      .sort((a, b) => (b.priority || 1) - (a.priority || 1))
      .slice(0, 3);
  } catch (error) {
    console.error('Error fetching restaurant promotions:', error);
    return [];
  }
};
