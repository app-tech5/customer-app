/** Helpers for filtering promotions by restaurant (used by promotions.js and public filterRestaurantPromotions). */

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
