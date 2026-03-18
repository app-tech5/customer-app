# Backend endpoints reference

Base URL: `config.API_BASE_URL` (see `api/constants.js`). All endpoints below are relative to that base. Auth: `Authorization: Bearer <token>` for protected routes.

## Auth

| Method | Path |
|--------|------|
| POST | `/auth/login` |
| POST | `/auth/signup` |
| POST | `/auth/refresh` |
| POST | `/auth/forgot-password` |
| POST | `/auth/reset-password` |
| POST | `/auth/change-password` |

## Users

| Method | Path |
|--------|------|
| GET | `/users/:userId` |
| PUT | `/users/:userId` |
| PUT | `/users/:userId/avatar` |
| GET | `/users/favorites` |
| POST | `/users/favorites/:restaurantId` |
| DELETE | `/users/favorites/:restaurantId` |
| GET | `/users/:userId/addresses` |
| POST | `/users/:userId/addresses` |
| GET | `/users/:userId/addresses/:addressId` |
| PUT | `/users/:userId/addresses/:addressId` |
| DELETE | `/users/:userId/addresses/:addressId` |
| PUT | `/users/:userId/addresses/:addressId/default` |
| GET | `/users/:userId/payment-methods` |
| GET | `/users/:userId/payment-methods/:paymentMethodId` |
| POST | `/users/:userId/payment-methods` |
| DELETE | `/users/:userId/payment-methods/:paymentMethodId` |
| PUT | `/users/:userId/payment-methods/:paymentMethodId/default` |
| GET | `/users/:userId/transactions` |
| GET | `/users/:userId/transactions/:transactionId` |
| GET | `/users/:userId/wallet/balance` |
| POST | `/users/:userId/wallet/add-money` |
| POST | `/users/:userId/wallet/withdraw` |
| GET | `/users/:userId/reviews` |

## Resources (read / global)

| Method | Path |
|--------|------|
| GET | `/resource/restaurants` |
| GET | `/resource/restaurants/:id` |
| GET | `/resource/restaurants/nearby` |
| GET | `/resource/restaurants/:id/opening-hours` |
| GET | `/resource/categories` |
| GET | `/resource/categories/:id` |
| GET | `/resource/menus` |
| GET | `/resource/variants` |
| GET | `/resource/variants/:id` |
| GET | `/resource/promotions` |
| GET | `/resource/promotions/:id` |
| POST | `/resource/promotions/validate-code` |
| GET | `/resource/reviews` |
| GET | `/resource/reviews/:id` |
| POST | `/resource/reviews` |
| PUT | `/resource/reviews/:id` |
| DELETE | `/resource/reviews/:id` |
| GET | `/resource/deliverysettings` |
| GET | `/resource/deliverysettings/estimate` |
| GET | `/resource/settings` |
| GET | `/resource/settings/app-config` |
| GET | `/resource/drivers/:id` |
| GET | `/resource/drivers/:id/location` |

## Products (foods)

| Method | Path |
|--------|------|
| GET | `/products?type=:restaurantId` |
| GET | `/products/:foodId` |
| GET | `/products/:foodId?restaurantId=:restaurantId` |

## Orders

| Method | Path |
|--------|------|
| GET | `/resource/orders` |
| GET | `/resource/orders/:id` |
| POST | `/resource/orders` |
| PUT | `/resource/orders/:id` |
| GET | `/resource/orders/:id/tracking` |
| POST | `/resource/orders/:id/rate` |
| POST | `/resource/orders/:id/reorder` |

## Cart

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
