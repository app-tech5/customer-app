export function isPromotionActive(promotion) {
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
}

export function getApplicableRestaurantsForScope(promotion, allRestaurants) {
  if (promotion.scope === 'restaurant') {
    if (
      promotion.applicableRestaurants &&
      Array.isArray(promotion.applicableRestaurants)
    ) {
      const applicableRestaurants = allRestaurants.filter((restaurant) => {
        const restaurantId = restaurant._id || restaurant.restaurantId;
        return promotion.applicableRestaurants.some((restId) => {
          const promoRestId =
            typeof restId === 'object' ? restId.toString() : restId;
          const restIdStr = restaurantId ? restaurantId.toString() : '';
          return promoRestId === restIdStr;
        });
      });
      return {
        applicableRestaurants,
        applicableRestaurantsCount: applicableRestaurants.length,
      };
    }
    return { applicableRestaurants: [], applicableRestaurantsCount: 0 };
  }
  if (promotion.scope === 'platform') {
    return {
      applicableRestaurants: allRestaurants.slice(0, 3),
      applicableRestaurantsCount: allRestaurants.length,
    };
  }
  if (promotion.scope === 'category') {
    if (
      promotion.applicableCategories &&
      Array.isArray(promotion.applicableCategories)
    ) {
      const applicableRestaurants = allRestaurants.filter((restaurant) => {
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
      return {
        applicableRestaurants,
        applicableRestaurantsCount: applicableRestaurants.length,
      };
    }
    return { applicableRestaurants: [], applicableRestaurantsCount: 0 };
  }
  return {
    applicableRestaurants: allRestaurants.slice(0, 3),
    applicableRestaurantsCount: allRestaurants.length,
  };
}

export function getAvailabilityForScope(
  promotion,
  applicableRestaurantsCount,
  allRestaurants
) {
  if (promotion.scope === 'platform') {
    return {
      availabilityText: 'all restaurants',
      availabilityCount: allRestaurants.length,
    };
  }
  if (promotion.scope === 'category') {
    const catCount = promotion.applicableCategories?.length || 0;
    return {
      availabilityText: `${catCount} categor${catCount > 1 ? 'ies' : 'y'}`,
      availabilityCount: catCount,
    };
  }
  if (promotion.scope === 'restaurant') {
    return {
      availabilityText: `${applicableRestaurantsCount} restaurant${applicableRestaurantsCount > 1 ? 's' : ''}`,
      availabilityCount: applicableRestaurantsCount,
    };
  }
  if (promotion.scope === 'item') {
    const itemCount = promotion.applicableItems?.length || 0;
    return {
      availabilityText: `${itemCount} item${itemCount > 1 ? 's' : ''}`,
      availabilityCount: itemCount,
    };
  }
  return { availabilityText: 'selected items', availabilityCount: 1 };
}

export function buildActiveOfferItem(
  promotion,
  applicableRestaurants,
  availabilityText,
  availabilityCount
) {
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
}

export function calculateRestaurantMenuIds(allMenus, restaurantId) {
  return new Set(
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
}

export function filterPromotionsByRestaurant(
  allPromotions,
  restaurantId,
  restaurantMenuIds
) {
  return allPromotions.filter((promotion) => {
    const now = new Date();
    const isActive =
      promotion.isActive &&
      now >= new Date(promotion.startDate) &&
      now <= new Date(promotion.endDate);
    if (!isActive) return false;

    const scopeMatch = (() => {
      if (promotion.scope === 'restaurant') {
        const hasApplicableRestaurants =
          promotion.applicableRestaurants &&
          Array.isArray(promotion.applicableRestaurants);
        if (hasApplicableRestaurants) {
          const restaurantIdStr = restaurantId.toString();
          const includesRestaurantId = promotion.applicableRestaurants.some(
            (restId) => {
              const promoRestId =
                typeof restId === 'object'
                  ? (restId._id || restId.toString())
                  : restId;
              return promoRestId.toString() === restaurantIdStr;
            }
          );
          if (includesRestaurantId) return true;
        }
        return false;
      }
      if (promotion.scope === 'item') {
        const hasApplicableItems =
          promotion.applicableItems &&
          Array.isArray(promotion.applicableItems);
        if (hasApplicableItems && restaurantMenuIds.size > 0) {
          const hasMatchingItem = promotion.applicableItems.some((itemId) => {
            const promoItemId =
              typeof itemId === 'object'
                ? (itemId._id || itemId.toString())
                : itemId;
            const promoItemIdStr = promoItemId ? promoItemId.toString() : '';
            return restaurantMenuIds.has(promoItemIdStr);
          });
          if (hasMatchingItem) return true;
        }
        return false;
      }
      if (promotion.scope === 'platform') return true;
      if (promotion.scope === 'category') return false;
      return false;
    })();

    return scopeMatch;
  });
}
