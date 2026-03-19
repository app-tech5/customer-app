# Utils – customer-app

Shared utilities: geolocation/distance, delivery time, AsyncStorage cache.

## Structure

```
utils/
├── README.md           (this file)
├── docs/
│   └── utils.md        (export reference)
├── index.js            (barrel: geoUtils + deliveryTime)
├── geoUtils.js         (bearing, getDistanceFromLatLonInKm)
├── deliveryTime.js     (calculateDeliveryTime, getRestaurantDeliveryTime)
├── cacheUtils.js       (cache barrel)
├── cacheCommon.js      (keys, config, isCacheExpired, hasDataChanged)
├── cacheFoods.js
├── cacheRestaurants.js
├── cachePromotions.js
├── cacheMenus.js
├── cacheSignIn.js
└── cacheCleanup.js
```

## Imports

- **Geo / delivery**: `import { getDistanceFromLatLonInKm, getRestaurantDeliveryTime } from '../utils'` (or `../utils/index.js`).
- **Cache**: `import { loadRestaurantsWithSmartCache, cleanupExpiredCache, ... } from '../utils/cacheUtils'`.

## Modules

| File | Role |
|------|------|
| **geoUtils** | `bearing(φ1, λ1, φ2, λ2)`; `getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2)` (Haversine, km). |
| **deliveryTime** | `calculateDeliveryTime(distanceKm, prepTime)`; `getRestaurantDeliveryTime(restaurant, userLocation)` → `{ min, max, distance }`. |
| **cacheUtils** | Re-exports cacheCommon, cacheFoods, cacheRestaurants, cachePromotions, cacheMenus, cacheSignIn, cacheCleanup. |

See `docs/utils.md` for full export details.
