import { ApiClient } from './client';
import { getAllMenus } from './menus';
import {
  calculateRestaurantMenuIds,
  filterPromotionsByRestaurant,
} from './promotionsHelpers';

ApiClient.prototype.getAllActiveOffers = async function () {
  try {
    const [allPromotions, allRestaurants] = await Promise.all([
      this.apiCall('/resource/promotions'),
      this.getRestaurants(),
    ]);

    const activePromotions = allPromotions.filter((promotion) => {
      const now = new Date();
      const isActive =
        promotion.isActive &&
        now >= new Date(promotion.startDate) &&
        now <= new Date(promotion.endDate);

      if (promotion.happyHours && promotion.happyHours.length > 0) {
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentDay = now.getDay();
        const isHappyHour = promotion.happyHours.some((slot) => {
          const [startH, startM] = slot.start.split(':').map(Number);
          const [endH, endM] = slot.end.split(':').map(Number);
          const isDayMatch = slot.days.includes(currentDay);
          const isTimeMatch =
            (currentHour > startH ||
              (currentHour === startH && currentMinutes >= startM)) &&
            (currentHour < endH ||
              (currentHour === endH && currentMinutes <= endM));
          return isDayMatch && isTimeMatch;
        });
        return isActive && isHappyHour;
      }
      return isActive;
    });

    const promotionsList = activePromotions.map((promotion) => {
      let applicableRestaurantsCount = 0;
      let applicableRestaurants = [];

      if (promotion.scope === 'restaurant') {
        if (
          promotion.applicableRestaurants &&
          Array.isArray(promotion.applicableRestaurants)
        ) {
          applicableRestaurants = allRestaurants.filter((restaurant) => {
            const restaurantId = restaurant._id || restaurant.restaurantId;
            return promotion.applicableRestaurants.some((restId) => {
              const promoRestId =
                typeof restId === 'object' ? restId.toString() : restId;
              const restIdStr = restaurantId ? restaurantId.toString() : '';
              return promoRestId === restIdStr;
            });
          });
          applicableRestaurantsCount = applicableRestaurants.length;
        }
      } else if (promotion.scope === 'platform') {
        applicableRestaurantsCount = allRestaurants.length;
        applicableRestaurants = allRestaurants.slice(0, 3);
      } else if (promotion.scope === 'category') {
        if (
          promotion.applicableCategories &&
          Array.isArray(promotion.applicableCategories)
        ) {
          applicableRestaurants = allRestaurants.filter((restaurant) => {
            if (!restaurant.categories) return false;
            return restaurant.categories.some((cat) =>
              promotion.applicableCategories.some(
                (promoCat) =>
                  cat === promoCat ||
                  cat.name === promoCat ||
                  cat._id === promoCat ||
                  (typeof cat === 'string' && cat === promoCat) ||
                  (cat && cat.toString() === promoCat)
              )
            );
          });
          applicableRestaurantsCount = applicableRestaurants.length;
        }
      } else {
        applicableRestaurantsCount = allRestaurants.length;
        applicableRestaurants = allRestaurants.slice(0, 3);
      }

      let availabilityText = '';
      let availabilityCount = 0;
      if (promotion.scope === 'platform') {
        availabilityText = 'all restaurants';
        availabilityCount = allRestaurants.length;
      } else if (promotion.scope === 'category') {
        const catCount = promotion.applicableCategories?.length || 0;
        availabilityText = `${catCount} categor${catCount > 1 ? 'ies' : 'y'}`;
        availabilityCount = catCount;
      } else if (promotion.scope === 'restaurant') {
        availabilityText = `${applicableRestaurantsCount} restaurant${applicableRestaurantsCount > 1 ? 's' : ''}`;
        availabilityCount = applicableRestaurantsCount;
      } else if (promotion.scope === 'item') {
        const itemCount = promotion.applicableItems?.length || 0;
        availabilityText = `${itemCount} item${itemCount > 1 ? 's' : ''}`;
        availabilityCount = itemCount;
      } else {
        availabilityText = 'selected items';
        availabilityCount = 1;
      }

      return {
        id: promotion._id,
        promotion,
        discount_percentage:
          promotion.promotionType === 'percentage_discount'
            ? promotion.discountValue
            : 0,
        free_delivery: promotion.promotionType === 'free_delivery',
        bogo_offer: promotion.promotionType === 'buy_x_get_y',
        flash_deal: promotion.promotionType === 'flash_sale',
        name: promotion.name,
        description: promotion.description,
        image_url: promotion.image,
        scope: promotion.scope,
        availabilityText,
        availabilityCount,
        applicableRestaurants: applicableRestaurants.slice(0, 3),
        applicableCategories: promotion.applicableCategories,
        applicableItems: promotion.applicableItems,
        priority: promotion.priority || 1,
        endDate: promotion.endDate,
      };
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
