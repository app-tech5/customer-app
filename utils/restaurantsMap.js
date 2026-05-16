import { isUsableGeoCoordinate, parseGeoCoordinate } from './geoUtils'
import { getDistanceKmBetweenUserAndRestaurant } from './deliveryTime'

export const DEFAULT_REGION = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
}

export const createDefaultFocus = (length) => (
  new Array(length).fill({
    backgroundColor: 'white',
    color: 'black',
    zIndex: 1,
  })
)

export const createFocusedState = (length, index) => ([
  ...Array(index).fill({
    backgroundColor: 'white',
    color: 'black',
    zIndex: 1,
  }),
  {
    backgroundColor: 'black',
    color: 'white',
    zIndex: 1000,
  },
  ...Array(Math.max(0, length - index - 1)).fill({
    backgroundColor: 'white',
    color: 'black',
    zIndex: 1,
  }),
])

export const getRestaurantCoordinates = (restaurant) => {
  const latitude = parseGeoCoordinate(restaurant?.latitude ?? restaurant?.lat)
  const longitude = parseGeoCoordinate(restaurant?.longitude ?? restaurant?.lng)

  if (!isUsableGeoCoordinate(latitude, longitude)) {
    return null
  }

  return { latitude, longitude }
}

const buildRestaurantWithMeta = (restaurant, originalIndex, userLocation) => {
  const coordinates = getRestaurantCoordinates(restaurant)

  if (!coordinates) {
    return null
  }

  return {
    ...restaurant,
    originalIndex,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    distance: getDistanceKmBetweenUserAndRestaurant(restaurant, userLocation),
  }
}

export const buildSortedRestaurants = (restaurantData, userLocation) => {
  return restaurantData
    .map((restaurant, originalIndex) => buildRestaurantWithMeta(restaurant, originalIndex, userLocation))
    .filter(Boolean)
    .filter((restaurant) => restaurant.distance !== null && restaurant.distance < 10)
    .sort((a, b) => a.distance - b.distance)
}

export const buildMapRestaurants = (restaurantData, userLocation) => {
  return restaurantData
    .map((restaurant, originalIndex) => buildRestaurantWithMeta(restaurant, originalIndex, userLocation))
    .filter(Boolean)
    .sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0
      if (a.distance === null) return 1
      if (b.distance === null) return -1
      return a.distance - b.distance
    })
    .slice(0, 20)
}

export const getZoomLevel = (latitudeDelta = 0.005) => {
  const safeDelta = Math.max(Number(latitudeDelta) || 0.005, 0.0005)
  return Math.max(3, Math.min(18, Math.round(Math.log2(360 / safeDelta))))
}

export const getNearbyRestaurantsRegion = (restaurantData, userLocation) => {
  const nearbyRestaurants = restaurantData
    .map((restaurant) => {
      const coordinates = getRestaurantCoordinates(restaurant)

      if (!coordinates) {
        return null
      }

      const distance = getDistanceKmBetweenUserAndRestaurant(restaurant, userLocation) ?? 0

      return distance > 0 && distance < 5 ? coordinates : null
    })
    .filter(Boolean)

  if (!nearbyRestaurants.length) {
    return null
  }

  const lats = nearbyRestaurants.map((restaurant) => restaurant.latitude)
  const lngs = nearbyRestaurants.map((restaurant) => restaurant.longitude)

  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  const latMargin = (maxLat - minLat) * 0.2
  const lngMargin = (maxLng - minLng) * 0.2

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(maxLat - minLat + latMargin * 2, 0.01),
    longitudeDelta: Math.max(maxLng - minLng + lngMargin * 2, 0.01),
  }
}
