import {
  getDistanceFromLatLonInKm,
  isUsableGeoCoordinate,
  parseGeoCoordinate,
} from './geoUtils';

const MAX_DELIVERY_DISTANCE_KM = 50;

export function normalizeUserLocation(loc) {
  if (!loc) return null;
  const lat = parseGeoCoordinate(loc.latitude ?? loc.lat);
  const lon = parseGeoCoordinate(loc.longitude ?? loc.lng);
  if (!isUsableGeoCoordinate(lat, lon)) return null;
  return { latitude: lat, longitude: lon };
}

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

/** Distance km user ↔ restaurant, ou `null` si coords invalides / trop loin. */
export function getDistanceKmBetweenUserAndRestaurant(restaurant, userLocation) {
  const user = normalizeUserLocation(userLocation);
  const restLat = parseGeoCoordinate(restaurant?.latitude);
  const restLon = parseGeoCoordinate(restaurant?.longitude);

  if (!user || !isUsableGeoCoordinate(restLat, restLon)) {
    return null;
  }

  const distance = getDistanceFromLatLonInKm(
    user.latitude,
    user.longitude,
    restLat,
    restLon,
  );

  if (!Number.isFinite(distance) || distance > MAX_DELIVERY_DISTANCE_KM) {
    return null;
  }

  return Math.round(distance * 10) / 10;
}

export function getRestaurantDeliveryTime(restaurant, userLocation) {
  const prepTime = parseInt(restaurant?.collectTime, 10) || 25;
  const prepOnly = { min: prepTime, max: prepTime + 10, distance: 0 };

  if (!restaurant || !userLocation) {
    return prepOnly;
  }

  try {
    const distance = getDistanceKmBetweenUserAndRestaurant(restaurant, userLocation);
    if (distance == null) {
      return prepOnly;
    }
    return calculateDeliveryTime(distance, prepTime);
  } catch (error) {
    console.warn('Erreur calcul temps livraison:', error);
    return prepOnly;
  }
}
