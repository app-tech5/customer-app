export function getRestaurantId(restaurant) {
  if (!restaurant) {
    return null;
  }

  return restaurant._id || restaurant.restaurantId || restaurant.id || null;
}

export function restaurantIdsMatch(left, right) {
  if (left == null || right == null) {
    return false;
  }

  return String(left) === String(right);
}
