# Utils

Shared helpers in `../utils.js` (re-exported from `global/index.js`).

## `formatRestaurantRatingDisplay(rating, reviewCount)`

- Returns a one-decimal rating string, or the i18n “no reviews” string when count is 0 / invalid.
- **Used in:** Restaurant detail surfaces (e.g. `RestaurantDetail.js`).

## `formatRestaurantRatingSummary(rating, reviewCount)`

- Returns localized `ratingWithReviews` text, or “no reviews”.
- **Used in:** `RestaurantDetailComponent`, `restaurantDetail/About.js`.

## `generateUID()`

- Short random base36 id (6 chars).
- **Usage:** Available for list keys / temporary ids; not widely imported today.

## `getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2)`

- Haversine distance in km.
- **Note:** A fuller geo toolkit lives in `utils/geoUtils.js` (preferred for new map code). Some screens still import distance helpers via `../utils` or `../global`.
