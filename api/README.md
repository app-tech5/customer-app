# API layer – customer-app

HTTP client and backend calls for the customer app. Base URL comes from `config.API_BASE_URL`. Auth uses a Bearer JWT stored in AsyncStorage (`userToken` / `userData`).

> Endpoint paths below are taken from the current `api/*.js` sources. Compact list: [docs/endpoints.md](docs/endpoints.md).

## Architecture

| File / folder | Role |
|---------------|------|
| **client.js** | `ApiClient`: token/user, `apiCall()`, `apiCallMultipart()`, storage helpers. In `DEMO_MODE`, routes through `demo/handlers.js` for local write/read merges. |
| **constants.js** | `API_BASE_URL`, `API_TIMEOUT` from `config/` |
| **index.js** | Singleton `api` + named re-exports |
| **demo/** | Demo-mode handlers + local store (when `EXPO_PUBLIC_DEMO_MODE` / `config.DEMO_MODE` is on) |
| **promotionsHelpers.js** | Pure promotion filtering helpers |
| **walletUtils.js** | `mapOrderPaymentMethod`, `buildOrderPaymentTransaction` |

Domain files attach methods on `ApiClient.prototype` (or export standalone `fetch` helpers for menus/variants). `index.js` imports those modules for side effects and re-exports wrappers.

## Configuration

Set `EXPO_PUBLIC_API_URL` in `.env` (see `.env.example`). Resolved in `config/index.js` → `api/constants.js`.

## Usage

```js
import api from '../api';
// or
import { getRestaurants, createOrder } from '../api';

await api.login(email, password); // stores token when present
```

Login/register live on the `api` instance (`api.login`, `api.register`, `api.logout`). There are no Firebase-style `signInWithEmailAndPassword` / `db` / `storage` shims in this package.

## Modules (paths match the code)

### Auth (`auth.js`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `login(email, password)` | POST | `/auth/customer-login` |
| `register(userData)` | POST | `/auth/signup` |
| `logout()` | – | Clears token/user + storage |
| `refreshToken()` | POST | `/auth/refresh` |
| `requestPasswordReset(email)` | POST | `/auth/forgot-password` |
| `resetPassword(email, code, newPassword)` | POST | `/auth/reset-password` |
| `changePassword(currentPassword, newPassword)` | POST | `/auth/change-password` |

### User (`user.js`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getUserInfo(userId)` | GET | `/resource/users/${userId}` |
| `updateUser(userId, userData)` | PUT | `/resource/users/${userId}` |
| `getProfile` / `updateProfile` | – | Aliases of get/update user |
| `updateAvatar(userId, imageUriOrFormData)` | PUT | `/resource/users/${userId}/avatar` |

### Restaurants (`restaurants.js`)

| Method | HTTP | Endpoint / notes |
|--------|------|------------------|
| `getRestaurants()` | GET | `/resource/restaurants` (normalized; activated only) |
| `getRestaurantById(id)` | GET | `/resource/restaurants/${id}` |
| `searchRestaurants(query)` | – | Client-side filter over `getRestaurants()` |
| `getNearbyRestaurants(lat, lng, radiusKm)` | GET | `/resource/restaurants/nearby?lat=&lng=&radius=` |
| `getRestaurantOpeningHours(restaurantId)` | GET | `/resource/restaurants/${id}/opening-hours` |
| `getRestaurantMongoId(restaurant)` | – | Exported helper (id resolution) |

### Categories (`categories.js`)

| Method | HTTP | Endpoint / notes |
|--------|------|------------------|
| `getCategories()` | GET | `/resource/categories` |
| `getCategoryById(categoryId)` | GET | `/resource/categories/${categoryId}` |
| `getCategoriesFromRestaurant(restaurantId)` | – | Same as global `getCategories()` |
| `searchRestaurantsByCategory(categoryIdentifier)` | – | Client-side filter |

### Foods (`foods.js`)

| Method | HTTP | Endpoint / notes |
|--------|------|------------------|
| `getFoods(restaurantId)` | GET | `/resource/products?type=${restaurantId}` |
| `getFoodById(foodId, restaurantId?)` | GET | `/resource/products/${foodId}` (+ optional `restaurantId`) |
| `getFoodsByCategory` / `searchFoods` | – | Client-side filters over `getFoods()` |

### Menus (`menus.js`) – standalone `fetch` (no Bearer)

| Export | HTTP | Endpoint |
|--------|------|----------|
| `getAllMenus()` | GET | `/resource/menus` |
| `getAllMenuItems()` | – | Maps `getAllMenus()` |
| `getMenusByRestaurant(restaurantId)` | GET | `/resource/menus?restaurantId=` |

### Variants (`variants.js`) – standalone `fetch` (no Bearer)

| Export | HTTP | Endpoint |
|--------|------|----------|
| `getVariants()` | GET | `/resource/variants` |
| `getVariantById(variantId)` | GET | `/resource/variants/${variantId}` |

### Orders (`orders.js`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `createOrder(orderData)` | POST | `/resource/orders` |
| `getOrders()` | GET | `/resource/orders` |
| `getOrderById(orderId)` | GET | `/resource/orders/${orderId}` |
| `updateOrderStatus(orderId, status)` | PUT | `/resource/orders/${orderId}` |
| `cancelOrder(orderId)` | – | `updateOrderStatus(..., 'cancelled')` |
| `getOrderTracking(orderId)` | GET | `/resource/orders/${orderId}/tracking` |
| `rateOrder(orderId, rating, comment)` | POST | `/resource/orders/${orderId}/rate` |
| `reorder(orderId)` | POST | `/resource/orders/${orderId}/reorder` |

### Cart (`cart.js`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getCart()` | GET | `/cart` |
| `addToCart(itemData)` | POST | `/cart/items` |
| `removeFromCart(itemId)` | DELETE | `/cart/items/${itemId}` |
| `updateCartItem(itemId, itemData)` | PUT | `/cart/items/${itemId}` |
| `clearRestaurantFromCart(restaurantName)` | DELETE | `/cart/restaurant/${encodeURIComponent(restaurantName)}` |
| `clearCart()` | DELETE | `/cart` |
| `syncCart(localItems)` | POST | `/cart/sync` |
| `getCartCount()` | – | Derived from `getCart()` |
| `applyPromoCode(code)` | POST | `/cart/promo` |
| `removePromoCode()` | DELETE | `/cart/promo` |

### Favorites (`favorites.js`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getFavorites()` | GET | `/users/favorites` |
| `addToFavorites(restaurantId)` | POST | `/users/favorites/${restaurantId}` |
| `removeFromFavorites(restaurantId)` | DELETE | `/users/favorites/${restaurantId}` |
| `isFavorite(restaurantId)` | – | Uses `getFavorites()` |

### Addresses (`addresses.js`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getUserAddresses(userId)` | GET | `/users/${userId}/addresses` |
| `addUserAddress` / `updateUserAddress` / `deleteUserAddress` | POST/PUT/DELETE | `/users/${userId}/addresses[...]` |
| `setDefaultAddress(userId, addressId)` | PUT | `.../default` |
| `getAddressById(userId, addressId)` | GET | `/users/${userId}/addresses/${addressId}` |

### Payment methods (`paymentMethods.js`)

Signatures on the client **do not** take `userId` (server uses the JWT).

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getUserPaymentMethods()` | GET | `/resource/paymentMethods/byUserId` |
| `addPaymentMethod(paymentMethodData)` | POST | `/resource/paymentMethods` |
| `getPaymentMethodById(id)` | GET | `/resource/paymentMethods/${id}` |
| `updatePaymentMethod(id, data)` | PUT | `/resource/paymentMethods/${id}` |
| `removePaymentMethod(id)` | DELETE | `/resource/paymentMethods/${id}` |
| `setDefaultPaymentMethod(id)` | PUT | `/resource/paymentMethods/${id}` body `{ isDefault: true }` |
| `createCardPaymentMethod(...)` | – | Stripe RN helper (exported from module) |

### Stripe payments (`payments.js`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `createStripePaymentIntent(payload)` | POST | `/payments/stripe/payment-intent` |
| `attachStripePaymentMethod(paymentMethodId)` | POST | `/payments/stripe/attach-payment-method` |
| `removeStripePaymentMethod(paymentMethodId)` | POST | `/payments/stripe/remove-payment-method` |

### Wallet (`wallet.js` + `walletUtils.js`)

There is **no** `getWalletBalance` / `withdrawFromWallet` in this client.

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getUserTransactions()` | GET | `/resource/transactions/byUserId` |
| `addMoneyToWallet(transactionData)` | POST | `/resource/transactions` |
| `recordOrderPayment({ userId, amount, paymentMethod, orderId })` | – | Builds payload via `walletUtils` then `addMoneyToWallet` |

### Delivery settings (`deliverySettings.js`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getDeliverySettings()` | GET | `/resource/deliverysettings` (fallback defaults on error) |
| `getRestaurantDeliverySettings(restaurantId)` | GET | `/resource/deliverysettings?type=${restaurantId}` |
| `estimateDeliveryFee(addressId, restaurantId, cartAmount)` | GET | `/resource/deliverysettings/estimate?...` |

### Promotions (`promotions.js` + helpers)

| Method / export | HTTP | Endpoint / notes |
|-----------------|------|------------------|
| `getAllActiveOffers()` | GET | `/resource/promotions` (+ restaurants; filters active) |
| `getRestaurantPromotions(restaurantId, options?)` | GET | promotions + menus; scoped/sorted |
| `getPromotionById(promotionId)` | GET | `/resource/promotions/${id}` |
| `validatePromoCode(code, restaurantId, cartAmount)` | POST | `/resource/promotions/validate-code` |
| `filterRestaurantPromotions(...)` | – | Standalone helper |
| `getAllPromotions()` | GET | raw `/resource/promotions` (from index) |

### Reviews (`reviews.js`)

| Method | HTTP | Endpoint / notes |
|--------|------|------------------|
| `getRestaurantReviews(restaurantId)` | GET | `/resource/reviews` then client filter |
| `getMyReviews(userId)` | GET | `/users/${userId}/reviews` |
| `getReviewById` / `createReview` / `updateReview` / `deleteReview` | GET/POST/PUT/DELETE | `/resource/reviews[...]` |

### Settings (`settings.js`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getSettings()` | GET | `/resource/settings` |
| `getAppConfig()` | GET | `/resource/app_settings` (first array element if list) |

### Gateways (`gateways.js`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getGateways()` | GET | `/resource/gateways` |

### Drivers (`drivers.js`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getDriverInfo(driverId)` | GET | `/resource/drivers/${driverId}` |
| `getDriverLocation(driverId, orderId?)` | GET | `/resource/drivers/${driverId}/location` |

### Upload (`upload.js`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `uploadPublicFile(asset, folder?)` | POST multipart | `/upload/public` (in demo mode returns the local URI) |

## Index exports (summary)

- **Default:** `api` (`ApiClient` instance) — use `api.login` / `api.register` / `api.logout` and other prototype methods.
- **Named wrappers:** restaurants, categories, foods, menus, variants, orders, cart, favorites, addresses, payment methods, Stripe payments, wallet/transactions, promotions, reviews, delivery settings, settings, gateways, drivers, upload, user profile helpers (see `index.js`).
- **Not present:** Firebase-style `auth` object, `db`, `storage`, or collection-name string exports.

## Error handling

- `apiCall` / `apiCallMultipart` throw on non-OK HTTP or network failure.
- Some methods catch and return `null`, `[]`, or defaults (opening hours, delivery settings, app config, food by id, etc.).
- Standalone menus/variants catch and return `[]` / `null`.

## Demo mode

When `config.DEMO_MODE` is true, `client.js` consults `demo/handlers.js` before/after network calls so buyers can exercise flows against seeded/local demo state.
