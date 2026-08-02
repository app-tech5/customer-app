# API layer – customer-app

This folder contains the HTTP client and all backend API calls for the customer app. The app talks to a single backend base URL; auth is handled via a Bearer token stored in AsyncStorage.

## Architecture

| File | Role |
|------|------|
| **client.js** | `ApiClient` class: token storage, `apiCall()`, headers, persist/clear session |
| **constants.js** | `API_BASE_URL` (from `config/index.js` via `../config`) |
| **index.js** | Singleton `api` instance and re-exports of public API methods |

Each domain (auth, restaurants, orders, etc.) is implemented by adding methods on `ApiClient.prototype` in its own file. `index.js` imports those files (side-effect) and re-exports either `api.<method>` or named functions that delegate to `api`.

**Auth note:** After login/register, the backend returns `token` and `user`. The client stores them and sends `Authorization: Bearer <token>` on subsequent requests. Logout clears token and user from memory and storage.

## Configuration

- **Base URL:** `api/constants.js` reads `config.API_BASE_URL` from `config/index.js`. Set `EXPO_PUBLIC_API_URL` in `.env` (see `.env.example`).

## Usage

Import the singleton or named functions from the api index:

```js
import api from '../api';
// or
import { getRestaurants, getOrders, createOrder } from '../api';
```

- **Authenticated calls:** Use `api` (or the named wrappers) so that `apiCall()` attaches the stored token.

## Modules and endpoints

### Core

- **client.js** – `ApiClient`: `getHeaders()`, `apiCall(endpoint, options)`, `saveToStorage()`, `clearStorage()`, `setToken()`, `getToken()`. Constructor loads token/user from AsyncStorage.
- **constants.js** – `API_BASE_URL`.

### Auth (`auth.js`)

| Method | HTTP | Endpoint | Notes |
|--------|------|----------|--------|
| `login(email, password)` | POST | `/auth/login` | Sets token + user, saves to storage |
| `register(userData)` | POST | `/auth/signup` | Sets token + user, saves to storage |
| `logout()` | – | – | Clears token/user and storage |
| `refreshToken()` | POST | `/auth/refresh` | Body: `{ token }`, updates stored token |
| `requestPasswordReset(email)` | POST | `/auth/forgot-password` |
| `resetPassword(email, code, newPassword)` | POST | `/auth/reset-password` |
| `changePassword(currentPassword, newPassword)` | POST | `/auth/change-password` |

### User (`user.js`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getUserInfo(userId)` | GET | `/users/${userId}` |
| `updateUser(userId, userData)` | PUT | `/users/${userId}` |
| `getProfile(userId)` | GET | same as getUserInfo |
| `updateProfile(userId, userData)` | PUT | same as updateUser |
| `updateAvatar(userId, imageUriOrFormData)` | PUT | `/users/${userId}/avatar` |

### Restaurants (`restaurants.js`)

| Method | HTTP | Endpoint | Notes |
|--------|------|----------|--------|
| `getRestaurants()` | GET | `/resource/restaurants` | Response normalized with `restaurantId` |
| `getRestaurantById(id)` | GET | `/resource/restaurants/${id}` |
| `searchRestaurants(query)` | – | Client-side filter over `getRestaurants()` |
| `getNearbyRestaurants(lat, lng, radiusKm)` | GET | `/resource/restaurants/nearby?lat=&lng=&radius=` |
| `getRestaurantOpeningHours(restaurantId)` | GET | `/resource/restaurants/${id}/opening-hours` |

### Categories (`categories.js`)

| Method | HTTP | Endpoint | Notes |
|--------|------|----------|--------|
| `getCategories()` | GET | `/resource/categories` | Normalizes `id` |
| `getCategoryById(categoryId)` | GET | `/resource/categories/${categoryId}` |
| `getCategoriesFromRestaurant(restaurantId)` | – | Same as getCategories (global list) |
| `searchRestaurantsByCategory(categoryIdentifier)` | – | Client-side filter over getRestaurants() |

### Foods (`foods.js`)

| Method | HTTP | Endpoint | Notes |
|--------|------|----------|--------|
| `getFoods(restaurantId)` | GET | `/products?type=${restaurantId}` |
| `getFoodById(foodId, restaurantId)` | GET | `/products/${foodId}` optional `?restaurantId=` |
| `getFoodsByCategory(restaurantId, categoryId)` | – | Client-side filter over getFoods() |
| `searchFoods(restaurantId, query)` | – | Client-side filter over getFoods() |

### Menus (`menus.js`) – standalone

Uses `fetch` + `API_BASE_URL` directly (no `ApiClient`, no auth token).

| Export | HTTP | Endpoint | Notes |
|--------|------|----------|--------|
| `getAllMenus()` | GET | `/resource/menus` | Returns raw list |
| `getAllMenuItems()` | – | – | Uses getAllMenus(), maps restaurantId/restaurantName |
| `getMenusByRestaurant(restaurantId)` | GET | `/resource/menus?restaurantId=` | Returns menus for one restaurant |

### Variants (`variants.js`) – standalone

Uses `fetch` + `API_BASE_URL` directly (no auth).

| Export | HTTP | Endpoint |
|--------|------|----------|
| `getVariants()` | GET | `/resource/variants` |
| `getVariantById(variantId)` | GET | `/resource/variants/${variantId}` |

### Orders (`orders.js`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `createOrder(orderData)` | POST | `/resource/orders` |
| `getOrders()` | GET | `/resource/orders` (normalizes `id`) |
| `getOrderById(orderId)` | GET | `/resource/orders/${orderId}` |
| `updateOrderStatus(orderId, status)` | PUT | `/resource/orders/${orderId}` body `{ status }` |
| `cancelOrder(orderId)` | – | Calls updateOrderStatus(orderId, 'cancelled') |
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
| `syncCart(localItems)` | POST | `/cart/sync` body `{ localItems }` |
| `getCartCount()` | – | Uses getCart(), sums item quantities |
| `applyPromoCode(code)` | POST | `/cart/promo` body `{ code }` |
| `removePromoCode()` | DELETE | `/cart/promo` |

### Favorites (`favorites.js`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getFavorites()` | GET | `/users/favorites` |
| `addToFavorites(restaurantId)` | POST | `/users/favorites/${restaurantId}` |
| `removeFromFavorites(restaurantId)` | DELETE | `/users/favorites/${restaurantId}` |
| `isFavorite(restaurantId)` | – | Uses getFavorites(), checks by id |

### Addresses (`addresses.js`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getUserAddresses(userId)` | GET | `/users/${userId}/addresses` |
| `addUserAddress(userId, addressData)` | POST | `/users/${userId}/addresses` |
| `updateUserAddress(userId, addressId, addressData)` | PUT | `/users/${userId}/addresses/${addressId}` |
| `deleteUserAddress(userId, addressId)` | DELETE | `/users/${userId}/addresses/${addressId}` |
| `setDefaultAddress(userId, addressId)` | PUT | `/users/${userId}/addresses/${addressId}/default` |
| `getAddressById(userId, addressId)` | GET | `/users/${userId}/addresses/${addressId}` |

### Payment methods (`paymentMethods.js`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getUserPaymentMethods(userId)` | GET | `/users/${userId}/payment-methods` |
| `getPaymentMethodById(userId, paymentMethodId)` | GET | `/users/${userId}/payment-methods/${paymentMethodId}` |
| `addPaymentMethod(userId, paymentMethodData)` | POST | `/users/${userId}/payment-methods` |
| `removePaymentMethod(userId, paymentMethodId)` | DELETE | `/users/${userId}/payment-methods/${paymentMethodId}` |
| `setDefaultPaymentMethod(userId, paymentMethodId)` | PUT | `/users/${userId}/payment-methods/${paymentMethodId}/default` |

### Wallet (`wallet.js`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getUserTransactions(userId, page, limit)` | GET | `/users/${userId}/transactions?page=&limit=` |
| `getTransactionById(userId, transactionId)` | GET | `/users/${userId}/transactions/${transactionId}` |
| `getWalletBalance(userId)` | GET | `/users/${userId}/wallet/balance` |
| `addMoneyToWallet(userId, amount, paymentMethodId)` | POST | `/users/${userId}/wallet/add-money` |
| `withdrawFromWallet(userId, amount, paymentMethodId)` | POST | `/users/${userId}/wallet/withdraw` |

### Delivery settings (`deliverySettings.js`)

| Method | HTTP | Endpoint | Notes |
|--------|------|----------|--------|
| `getDeliverySettings()` | GET | `/resource/deliverysettings` | On error returns DEFAULT_DELIVERY_SETTINGS |
| `estimateDeliveryFee(addressId, restaurantId, cartAmount)` | GET | `/resource/deliverysettings/estimate?addressId=&restaurantId=&amount=` |

### Promotions (`promotions.js` + `promotionsHelpers.js`)

- **promotionsHelpers.js** – Pure helpers: active promotion filter, scope (restaurant/platform/category), availability text, building offer list items. Used by `promotions.js` and by `filterRestaurantPromotions`.
- **promotions.js** – Adds to `ApiClient` and exports a standalone function.

| Method / export | HTTP | Endpoint | Notes |
|-----------------|------|----------|--------|
| `getAllActiveOffers()` | GET | `/resource/promotions` + getRestaurants | Filters active (dates, happy hours), maps to list with availability |
| `getRestaurantPromotions(restaurantId)` | GET | `/resource/promotions` + getAllMenus | Filters by restaurant/menu scope, returns top 3 by priority |
| `getPromotionById(promotionId)` | GET | `/resource/promotions/${promotionId}` |
| `validatePromoCode(code, restaurantId, cartAmount)` | POST | `/resource/promotions/validate-code` body `{ code, restaurantId?, amount? }` |
| `filterRestaurantPromotions(allPromotions, restaurantId, allMenus?)` | – | – | Standalone: filter + sort + slice 3 |

Raw list: `api.apiCall('/resource/promotions')` or from index `getAllPromotions()`.

### Reviews (`reviews.js`)

| Method | HTTP | Endpoint | Notes |
|--------|------|----------|--------|
| `getRestaurantReviews(restaurantId)` | – | GET `/resource/reviews` | Client-side filter by restaurant + status approved, sorted by date |
| `getMyReviews(userId)` | GET | `/users/${userId}/reviews` |
| `getReviewById(reviewId)` | GET | `/resource/reviews/${reviewId}` |
| `createReview(restaurantId, data)` | POST | `/resource/reviews` body `{ restaurantId, ...data }` |
| `updateReview(reviewId, data)` | PUT | `/resource/reviews/${reviewId}` |
| `deleteReview(reviewId)` | DELETE | `/resource/reviews/${reviewId}` |

### Settings (`settings.js`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getSettings()` | GET | `/resource/settings` |
| `getAppConfig()` | GET | `/resource/settings/app-config` |

### Drivers (`drivers.js`)

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getDriverInfo(driverId)` | GET | `/resource/drivers/${driverId}` |
| `getDriverLocation(driverId, orderId?)` | GET | `/resource/drivers/${driverId}/location` optional `?orderId=` |

## Index exports (summary)

- **Default:** `api` (ApiClient instance).
- **Auth object:** `auth` with `currentUser`, `signOut`.
- **Auth helpers:** `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `onAuthStateChanged`, `refreshToken`, `requestPasswordReset`, `resetPassword`, `changePassword`.
- **Restaurants, categories, orders, user, foods, reviews, delivery, promotions, cart, favorites, addresses, payment methods, wallet, settings, drivers** – all methods re-exported as named functions (e.g. `getRestaurants`, `createOrder`).
- **Menus / variants:** `getAllMenus`, `getAllMenuItems`, `getMenusByRestaurant`, `getVariants`, `getVariantById`.
- **Promotions:** `filterRestaurantPromotions`.
- **Placeholders:** `db`, `storage` (empty objects).
- **Collection names:** `restaurantsCol`, `categoriesCol`, `ordersCol`, `userRef` (strings for compatibility).

## Error handling

- `apiCall()` throws on non-ok response or network error; callers may use try/catch. Some methods (e.g. getRestaurantOpeningHours, getDeliverySettings) catch and return `null` or a default.
- Standalone modules (`menus.js`, `variants.js`) catch and return `[]` or `null`.

## Documentation reference

- **Endpoint list:** see table per module above, or [docs/endpoints.md](docs/endpoints.md) for a compact list.
