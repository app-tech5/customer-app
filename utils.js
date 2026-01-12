import * as Location from 'expo-location';


export const bearing = (φ1, λ1, φ2, λ2) => {

  const x = Math.sin((λ2 - λ1) * Math.PI / 180) * Math.cos(φ2 * Math.PI / 180);



  const y = Math.cos(φ1 * Math.PI / 180) * Math.sin(φ2 * Math.PI / 180) -
    Math.sin(φ1 * Math.PI / 180) * Math.cos(φ2 * Math.PI / 180) * Math.cos((λ2 - λ1) * Math.PI / 180);
  const θ = Math.atan2(x, y);



  return (θ * 180 / Math.PI + 360) % 360;



}

export const location = async () => {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
     setErrorMsg('Permission to access location was denied');
     return;
   }
     return Location
 };


export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}

/**
 * Calcule le temps de livraison estimé basé sur la distance
 * @param {number} distanceKm - Distance en kilomètres
 * @param {number} prepTime - Temps de préparation du restaurant (minutes)
 * @returns {object} - {min: number, max: number, distance: number}
 */
export function calculateDeliveryTime(distanceKm, prepTime = 25) {
  if (!distanceKm || distanceKm < 0) {
    return { min: prepTime, max: prepTime + 10, distance: 0 };
  }

  // Facteur temps par km (environ 2 minutes par km)
  const timePerKm = 2;

  // Temps de voyage aller-retour pour le livreur
  const travelTime = distanceKm * timePerKm;

  // Buffer pour imprévus (trafic, météo, etc.)
  const bufferTime = 5;

  // Calcul du temps total minimum
  const totalMin = prepTime + travelTime + bufferTime;

  // Fourchette maximum (+10 minutes pour imprévus)
  const totalMax = totalMin + 10;

  return {
    min: Math.round(totalMin),
    max: Math.round(totalMax),
    distance: Math.round(distanceKm * 10) / 10 // 1 décimale
  };
}

/**
 * Calcule le temps de livraison pour un restaurant et une position utilisateur
 * @param {object} restaurant - Objet restaurant avec latitude/longitude
 * @param {object} userLocation - Position utilisateur {latitude, longitude}
 * @returns {object} - {min: number, max: number, distance: number}
 */
export function getRestaurantDeliveryTime(restaurant, userLocation) {
  if (!restaurant || !userLocation) {
    return { min: 25, max: 35, distance: 0 };
  }

  try {
    // Conversion en nombres
    const restLat = parseFloat(restaurant.latitude);
    const restLon = parseFloat(restaurant.longitude);
    const userLat = parseFloat(userLocation.latitude);
    const userLon = parseFloat(userLocation.longitude);

    // Vérification des coordonnées valides
    if (isNaN(restLat) || isNaN(restLon) || isNaN(userLat) || isNaN(userLon)) {
      return { min: 25, max: 35, distance: 0 };
    }

    // Calcul de la distance
    const distance = getDistanceFromLatLonInKm(userLat, userLon, restLat, restLon);

    // Temps de préparation du restaurant (ou défaut 25min)
    const prepTime = parseInt(restaurant.collectTime) || 25;

    // Calcul du temps de livraison
    return calculateDeliveryTime(distance, prepTime);

  } catch (error) {
    console.warn('Erreur calcul temps livraison:', error);
    return { min: 25, max: 35, distance: 0 };
  }
}
