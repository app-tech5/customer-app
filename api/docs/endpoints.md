# Backend endpoints reference

Paths as called by this app’s `api/` client. Base URL: `config.API_BASE_URL` (`api/constants.js`). Relative paths below. Auth: `Authorization: Bearer <token>` when a session token is stored.

> Source of truth: the `api/*.js` modules. If this file drifts, trust the code.

## Auth (`auth.js`)

| Method | Path |
|--------|------|
| POST | `/auth/customer-login` |
| POST | `/auth/signup` |
| POST | `/auth/refresh` |
| POST | `/auth/forgot-password` |
| POST | `/auth/reset-password` |
| POST | `/auth/change-password` |

## Users (`user.js`)

| Method | Path |
|--------|------|
| GET | `/resource/users/:userId` |
| PUT | `/resource/users/:userId` |
| PUT | `/resource/users/:userId/avatar` |

## Favorites (`favorites.js`)

| Method | Path |
|--------|------|
| GET | `/users/favorites` |
| POST | `/users/favorites/:restaurantId` |
| DELETE | `/users/favorites/:restaurantId` |

## Addresses (`addresses.js`)

| Method | Path |
|--------|------|
| GET | `/users/:userId/addresses` |
| POST | `/users/:userId/addresses` |
| GET | `/users/:userId/addresses/:addressId` |
| PUT | `/users/:userId/addresses/:addressId` |
| DELETE | `/users/:userId/addresses/:addressId` |
| PUT | `/users/:userId/addresses/:addressId/default` |

## Payment methods (`paymentMethods.js`)

| Method | Path |
|--------|------|
| GET | `/resource/paymentMethods/byUserId` |
| POST | `/resource/paymentMethods` |
| GET | `/resource/paymentMethods/:id` |
| PUT | `/resource/paymentMethods/:id` |
| DELETE | `/resource/paymentMethods/:id` |

## Stripe payments (`payments.js`)

| Method | Path |
|--------|------|
| POST | `/payments/stripe/payment-intent` |
| POST | `/payments/stripe/attach-payment-method` |
| POST | `/payments/stripe/remove-payment-method` |

## Wallet / transactions (`wallet.js`)

| Method | Path |
|--------|------|
| GET | `/resource/transactions/byUserId` |
| POST | `/resource/transactions` |

## Resources – restaurants, catalog, orders, …

| Method | Path |
|--------|------|
| GET | `/resource/restaurants` |
| GET | `/resource/restaurants/:id` |
| GET | `/resource/restaurants/nearby?lat=&lng=&radius=` |
| GET | `/resource/restaurants/:id/opening-hours` |
| GET | `/resource/categories` |
| GET | `/resource/categories/:id` |
| GET | `/resource/menus` |
| GET | `/resource/menus?restaurantId=` |
| GET | `/resource/variants` |
| GET | `/resource/variants/:id` |
| GET | `/resource/products?type=:restaurantId` |
| GET | `/resource/products/:foodId` |
| GET | `/resource/products/:foodId?restaurantId=` |
| GET | `/resource/promotions` |
| GET | `/resource/promotions/:id` |
| POST | `/resource/promotions/validate-code` |
| GET | `/resource/reviews` |
| GET | `/resource/reviews/:id` |
| POST | `/resource/reviews` |
| PUT | `/resource/reviews/:id` |
| DELETE | `/resource/reviews/:id` |
| GET | `/users/:userId/reviews` |
| GET | `/resource/orders` |
| GET | `/resource/orders/:id` |
| POST | `/resource/orders` |
| PUT | `/resource/orders/:id` |
| GET | `/resource/orders/:id/tracking` |
| POST | `/resource/orders/:id/rate` |
| POST | `/resource/orders/:id/reorder` |
| GET | `/resource/deliverysettings` |
| GET | `/resource/deliverysettings?type=:restaurantId` |
| GET | `/resource/deliverysettings/estimate?addressId=&restaurantId=&amount=` |
| GET | `/resource/settings` |
| GET | `/resource/app_settings` |
| GET | `/resource/gateways` |
| GET | `/resource/drivers/:id` |
| GET | `/resource/drivers/:id/location` |
| GET | `/resource/drivers/:id/location?orderId=` |

## Cart (`cart.js`)

| Method | Path |
|--------|------|
| GET | `/cart` |
| DELETE | `/cart` |
| POST | `/cart/items` |
| PUT | `/cart/items/:itemId` |
| DELETE | `/cart/items/:itemId` |
| DELETE | `/cart/restaurant/:restaurantName` |
| POST | `/cart/sync` |
| POST | `/cart/promo` |
| DELETE | `/cart/promo` |

## Upload (`upload.js`)

| Method | Path |
|--------|------|
| POST | `/upload/public` (multipart) |
