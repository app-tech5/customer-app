import { ApiClient } from './client';
import { getAllMenus } from './menus';
import {
  buildActiveOfferItem,
  calculateRestaurantMenuIds,
  filterPromotionsByRestaurant,
  getApplicableRestaurantsForScope,
  getAvailabilityForScope,
  isPromotionActive,
} from './promotionsHelpers';

ApiClient.prototype.getAllActiveOffers = async function () {
  try {
    const [allPromotions, allRestaurants] = await Promise.all([
      this.apiCall('/resource/promotions'),
      this.getRestaurants(),
    ]);

    const activePromotions = allPromotions.filter(isPromotionActive);

    const promotionsList = activePromotions.map((promotion) => {
      const { applicableRestaurants, applicableRestaurantsCount } =
        getApplicableRestaurantsForScope(promotion, allRestaurants);
      const { availabilityText, availabilityCount } = getAvailabilityForScope(
        promotion,
        applicableRestaurantsCount,
        allRestaurants
      );
      return buildActiveOfferItem(
        promotion,
        applicableRestaurants,
        availabilityText,
        availabilityCount
      );
    });

    return promotionsList;
  } catch (error) {
    console.error('Error fetching all active offers:', error);
    return [];
  }
};

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

ApiClient.prototype.getPromotionById = async function (promotionId) {
  try {
    return await this.apiCall(`/resource/promotions/${promotionId}`);
  } catch (error) {
    console.error('Error fetching promotion:', error);
    return null;
  }
};

ApiClient.prototype.validatePromoCode = async function (code, restaurantId, cartAmount) {
  try {
    const body = { code };
    if (restaurantId != null) body.restaurantId = restaurantId;
    if (cartAmount != null) body.amount = cartAmount;
    return await this.apiCall('/resource/promotions/validate-code', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    return null;
  }
};
