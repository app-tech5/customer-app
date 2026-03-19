# Export reference – utils

## index.js (barrel)

Re-exports: `geoUtils` + `deliveryTime`.

---

## geoUtils.js

| Export | Signature | Description |
|--------|-----------|-------------|
| `bearing` | `(φ1, λ1, φ2, λ2)` | Bearing in degrees between two points (lat/lon in degrees). |
| `getDistanceFromLatLonInKm` | `(lat1, lon1, lat2, lon2)` | Haversine distance in km. |

---

## deliveryTime.js

| Export | Signature | Description |
|--------|-----------|-------------|
| `calculateDeliveryTime` | `(distanceKm, prepTime = 25)` | Returns `{ min, max, distance }` (minutes and rounded distance). |
| `getRestaurantDeliveryTime` | `(restaurant, userLocation)` | Uses restaurant `latitude`, `longitude`, `collectTime`; returns `{ min, max, distance }`. |

---

## cacheUtils.js (cache barrel)

Re-exports all modules below.

### cacheCommon.js

| Export | Description |
|--------|-------------|
| `CACHE_KEYS` | AsyncStorage keys (RESTAURANT_FOODS, RESTAURANTS, PROMOTIONS, MENUS, USER_SIGNIN_DATA, …). |
| `CACHE_CONFIG` | FOODS_EXPIRY, VERSION. |
| `isCacheExpired` | `(timestamp, expiryTime?)` → boolean. |
| `hasDataChanged` | `(oldData, newData)` → boolean. |
| `cacheI18n` | i18n for cache messages. |

### cacheFoods.js

| Export | Description |
|--------|-------------|
| `getFoodsCacheKey`, `getTimestampCacheKey` | Keys by `restaurantId`. |
| `saveFoodsToCache`, `getFoodsFromCache`, `clearFoodsCache` | Read/write/clear. |
| `loadFoodsWithSmartCache` | Load with cache + API when expired or changed. |

### cacheRestaurants.js / cachePromotions.js / cacheMenus.js

Same pattern: `save*ToCache`, `get*FromCache`, `clear*Cache`, `load*WithSmartCache`.

### cacheSignIn.js

| Export | Description |
|--------|-------------|
| `saveSignInData` | `(email, rememberMe)`. |
| `getSignInData` | Returns cached sign-in data. |
| `clearSignInData`, `updateSignInEmail` | Clear cache / update email. |

### cacheCleanup.js

| Export | Description |
|--------|-------------|
| `cleanupExpiredCache` | Removes expired cache entries (by timestamp). |
