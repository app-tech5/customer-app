# Export reference – utils

## index.js (barrel)

Re-exports: `geoUtils` + `deliveryTime` + `deliverySetting` + `restaurantsMap`.

---

## geoUtils.js

| Export | Description |
|--------|-------------|
| `bearing(φ1, λ1, φ2, λ2)` | Bearing in degrees |
| `parseGeoCoordinate(value)` | Number or `NaN` |
| `isUsableGeoCoordinate(lat, lon)` | Finite, in-range, not (0,0) |
| `getDistanceFromLatLonInKm(...)` | Haversine km |
| `getDistanceBetweenPointsInKm(from, to)` | Haversine from `{latitude,longitude}` |
| `getPointFromLocation(location)` | Point from GeoJSON coordinates or lat/lng fields |
| `getGeoJsonPointFromSocketPayload(payload)` | Point from socket location payload |
| `bearingAlongPolylineNearPoint(lat, lng, points)` | Bearing of nearest segment |

---

## deliveryTime.js

| Export | Description |
|--------|-------------|
| `normalizeUserLocation(loc)` | `{ latitude, longitude }` or null |
| `calculateDeliveryTime(distanceKm, prepTime = 25)` | `{ min, max, distance }` |
| `getDistanceKmBetweenUserAndRestaurant(restaurant, userLocation)` | km or null (caps at 50 km) |
| `getRestaurantDeliveryTime(restaurant, userLocation)` | ETA using `collectTime` + distance |

---

## deliverySetting.js

| Export | Description |
|--------|-------------|
| `calculateDeliveryFeeFromSetting(setting, distanceKm?)` | Fee number, `0`, or `null` if delivery disabled / too far |
| `usesDynamicDeliveryFee(setting)` | DYNAMIC / RESTAURANT_DEFINED |
| `hasDeliverySetting(setting)` | Presence check |

---

## restaurantsMap.js

| Export | Description |
|--------|-------------|
| `DEFAULT_REGION` | Paris-centered default map region |
| `createDefaultFocus` / `createFocusedState` | Marker/list focus styles |
| `getRestaurantCoordinates(restaurant)` | Parsed lat/lng or null |
| `buildSortedRestaurants` / `buildMapRestaurants` | Enriched lists for near-me / map |
| `getZoomLevel(latitudeDelta)` | Zoom from delta |
| `getNearbyRestaurantsRegion(...)` | Region covering nearby restaurants |

---

## geocodeAddress.js

| Export | Description |
|--------|-------------|
| `geocodeAddress(address)` | Nominatim → `{ lat, lng, description }` or null |

---

## orderTime.js

| Export | Description |
|--------|-------------|
| `formatEstimatedTime(dateString, t)` | Human ETA using an `i18n.t`-compatible `t` |

---

## pickImage.js

| Export | Description |
|--------|-------------|
| `pickImageFromLibrary()` | Image asset or null |
| `pickImageFromCamera()` | Image asset or null |

---

## restaurantId.js

| Export | Description |
|--------|-------------|
| `getRestaurantId(restaurant)` | `_id` / `restaurantId` / `id` |
| `restaurantIdsMatch(left, right)` | String equality of resolved ids |

---

## cacheUtils.js (barrel)

Re-exports cacheCommon, cacheFoods, cacheRestaurants, cachePromotions, cacheMenus, cacheSignIn, cacheCleanup.

### cacheCommon.js

| Export | Description |
|--------|-------------|
| `CACHE_KEYS` | AsyncStorage key constants |
| `CACHE_CONFIG` | Expiry / version |
| `isCacheExpired` / `hasDataChanged` | Helpers |

### cacheFoods / Restaurants / Promotions / Menus

Pattern: `save*ToCache`, `get*FromCache`, `clear*Cache`, `load*WithSmartCache`.

### cacheSignIn.js

`saveSignInData`, `getSignInData`, `clearSignInData`, `updateSignInEmail`.

### cacheCleanup.js

`cleanupExpiredCache`.
