import { ApiClient } from './client';

/** Resource: /resource/promotions — builds list of active offers (platform-wide). */
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
