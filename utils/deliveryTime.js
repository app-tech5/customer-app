import { getDistanceFromLatLonInKm } from './geoUtils';

export function calculateDeliveryTime(distanceKm, prepTime = 25) {
  if (!distanceKm || distanceKm < 0) {
    return { min: prepTime, max: prepTime + 10, distance: 0 };
  }

  const timePerKm = 2;
  const travelTime = distanceKm * timePerKm;
  const bufferTime = 5;
  const totalMin = prepTime + travelTime + bufferTime;
  const totalMax = totalMin + 10;

  return {
    min: Math.round(totalMin),
    max: Math.round(totalMax),
    distance: Math.round(distanceKm * 10) / 10
  };
}

export function getRestaurantDeliveryTime(restaurant, userLocation) {
  if (!restaurant || !userLocation) {
    return { min: 25, max: 35, distance: 0 };
  }

  try {
    const restLat = parseFloat(restaurant.latitude);
    const restLon = parseFloat(restaurant.longitude);
    const userLat = parseFloat(userLocation.latitude);
    const userLon = parseFloat(userLocation.longitude);

    if (isNaN(restLat) || isNaN(restLon) || isNaN(userLat) || isNaN(userLon)) {
      return { min: 25, max: 35, distance: 0 };
    }

    const distance = getDistanceFromLatLonInKm(userLat, userLon, restLat, restLon);
    const prepTime = parseInt(restaurant.collectTime, 10) || 25;
    return calculateDeliveryTime(distance, prepTime);
  } catch (error) {
    console.warn('Erreur calcul temps livraison:', error);
    return { min: 25, max: 35, distance: 0 };
  }
}
