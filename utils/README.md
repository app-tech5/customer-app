# Utils – customer-app

Shared helpers: geo/distance, delivery fee/time, map list builders, AsyncStorage cache, geocoding, image pick, restaurant id helpers.

## Structure

```
utils/
├── index.js              barrel: geoUtils + deliveryTime + deliverySetting + restaurantsMap
├── geoUtils.js
├── deliveryTime.js
├── deliverySetting.js
├── restaurantsMap.js
├── geocodeAddress.js     Nominatim (OSM) geocode
├── orderTime.js          estimated time formatting
├── pickImage.js          expo-image-picker helpers
├── restaurantId.js       id getters / matchers
├── cacheUtils.js         cache barrel
├── cacheCommon.js
├── cacheFoods.js
├── cacheRestaurants.js
├── cachePromotions.js
├── cacheMenus.js
├── cacheSignIn.js
└── cacheCleanup.js
```

## Imports

```js
import { getDistanceFromLatLonInKm, getRestaurantDeliveryTime } from '../utils';
import { calculateDeliveryFeeFromSetting } from '../utils';
import { loadRestaurantsWithSmartCache, cleanupExpiredCache } from '../utils/cacheUtils';
import { geocodeAddress } from '../utils/geocodeAddress';
import { pickImageFromLibrary } from '../utils/pickImage';
import { getRestaurantId } from '../utils/restaurantId';
```

`index.js` does **not** re-export cache, geocode, pickImage, orderTime, or restaurantId — import those files directly.

## Modules (short)

| File | Role |
|------|------|
| **geoUtils** | Bearing, Haversine, coordinate parsing, polyline bearing, GeoJSON helpers |
| **deliveryTime** | Delivery ETA windows + distance-to-restaurant helpers |
| **deliverySetting** | Fee calculation from a delivery-settings document |
| **restaurantsMap** | Default region, focus styles, sorted/map restaurant lists, zoom helpers |
| **geocodeAddress** | OpenStreetMap Nominatim lookup |
| **orderTime** | `formatEstimatedTime` |
| **pickImage** | Library / camera pick |
| **restaurantId** | `getRestaurantId`, `restaurantIdsMatch` |
| **cache\*** | Smart cache for foods / restaurants / promotions / menus / sign-in + cleanup |

See [docs/utils.md](docs/utils.md) for export details.

**Note:** `global/utils.js` also exports `getDistanceFromLatLonInKm` (and rating formatters). Prefer `utils/geoUtils` for map/geo work; do not assume both are always interchangeable in every screen.
