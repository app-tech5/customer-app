# API Reference - Good Food Pro Customer App

This document details all API endpoints used by the customer app.

---

## Configuration

```javascript
// config.js
API_BASE_URL: 'http://localhost:5000/api'
API_TIMEOUT: 10000 // 10 seconds
```

---

## Authentication

All authenticated endpoints require the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Register
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

---

## Users

### Get User Info
```http
GET /users/:userId
Authorization: Bearer <token>
```

### Update User
```http
PUT /users/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "+1234567890"
}
```

---

## Addresses

### Get User Addresses
```http
GET /users/:userId/addresses
Authorization: Bearer <token>
```

### Add Address
```http
POST /users/:userId/addresses
Authorization: Bearer <token>
Content-Type: application/json

{
  "label": "Home",
  "street": "123 Main St",
  "city": "Paris",
  "postalCode": "75001",
  "country": "France",
  "isDefault": true
}
```

### Update Address
```http
PUT /users/:userId/addresses/:addressId
Authorization: Bearer <token>
Content-Type: application/json

{
  "street": "456 New St"
}
```

### Delete Address
```http
DELETE /users/:userId/addresses/:addressId
Authorization: Bearer <token>
```

### Set Default Address
```http
PUT /users/:userId/addresses/:addressId/default
Authorization: Bearer <token>
```

---

## Favorites

### Get Favorites
```http
GET /users/favorites
Authorization: Bearer <token>
```

### Add to Favorites
```http
POST /users/favorites/:restaurantId
Authorization: Bearer <token>
```

### Remove from Favorites
```http
DELETE /users/favorites/:restaurantId
Authorization: Bearer <token>
```

---

## Wallet & Payments

### Get Payment Methods
```http
GET /users/:userId/payment-methods
Authorization: Bearer <token>
```

### Add Payment Method
```http
POST /users/:userId/payment-methods
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "credit_card",
  "cardNumber": "****1234",
  "expiryMonth": "12",
  "expiryYear": "2025",
  "cardholderName": "John Doe"
}
```

### Remove Payment Method
```http
DELETE /users/:userId/payment-methods/:paymentMethodId
Authorization: Bearer <token>
```

### Set Default Payment Method
```http
PUT /users/:userId/payment-methods/:paymentMethodId/default
Authorization: Bearer <token>
```

### Get Wallet Balance
```http
GET /users/:userId/wallet/balance
Authorization: Bearer <token>
```

### Add Money to Wallet
```http
POST /users/:userId/wallet/add-money
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50.00,
  "paymentMethodId": "pm_123"
}
```

### Withdraw from Wallet
```http
POST /users/:userId/wallet/withdraw
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 25.00,
  "paymentMethodId": "pm_123"
}
```

### Get Transactions
```http
GET /users/:userId/transactions?page=1&limit=20
Authorization: Bearer <token>
```

---

## Restaurants

### Get All Restaurants
```http
GET /resource/restaurants
```

**Response:**
```json
[
  {
    "_id": "rest_123",
    "name": "Pizza Palace",
    "image": "https://...",
    "rating": 4.5,
    "categories": ["Italian", "Pizza"],
    "deliveryTime": "25-35",
    "deliveryFee": 2.50,
    "address": { ... },
    "isOpen": true
  }
]
```

### Get Restaurant by ID
```http
GET /resource/restaurants/:id
```

---

## Categories

### Get All Categories
```http
GET /resource/categories
```

**Response:**
```json
[
  {
    "_id": "cat_123",
    "title": "Italian",
    "image": "https://..."
  }
]
```

---

## Menu & Products

### Get Menu Items (Products)
```http
GET /products?type=:restaurantId
```

**Response:**
```json
[
  {
    "_id": "item_123",
    "name": "Margherita Pizza",
    "description": "Classic tomato and mozzarella",
    "price": 12.99,
    "image": "https://...",
    "category": "Pizzas",
    "restaurant": "rest_123",
    "variants": [...],
    "extras": [...]
  }
]
```

### Get All Menus
```http
GET /resource/menus
```

### Get Variants
```http
GET /resource/variants
```

---

## Orders

### Create Order
```http
POST /resource/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "restaurant": "rest_123",
  "items": [
    {
      "menuItem": "item_123",
      "quantity": 2,
      "selectedVariants": [...],
      "selectedExtras": [...],
      "price": 25.98
    }
  ],
  "deliveryAddress": { ... },
  "paymentMethod": "credit_card",
  "deliveryType": "delivery",
  "specialInstructions": "Ring doorbell twice",
  "subtotal": 25.98,
  "deliveryFee": 2.50,
  "tax": 2.85,
  "total": 31.33
}
```

### Get All Orders
```http
GET /resource/orders
Authorization: Bearer <token>
```

### Get Order by ID
```http
GET /resource/orders/:orderId
Authorization: Bearer <token>
```

### Update Order Status
```http
PUT /resource/orders/:orderId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "preparing"
}
```

**Status values:**
- `pending`
- `preparing`
- `out_for_delivery`
- `delivered`
- `cancelled`

---

## Cart (Server-side)

### Get Cart
```http
GET /cart
Authorization: Bearer <token>
```

### Add Item to Cart
```http
POST /cart/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "menuItem": "item_123",
  "restaurant": "rest_123",
  "restaurantName": "Pizza Palace",
  "quantity": 1,
  "price": 12.99,
  "selectedVariants": [...],
  "selectedExtras": [...]
}
```

### Update Cart Item
```http
PUT /cart/items/:itemId
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3
}
```

### Remove Item from Cart
```http
DELETE /cart/items/:itemId
Authorization: Bearer <token>
```

### Clear Restaurant Items
```http
DELETE /cart/restaurant/:restaurantName
Authorization: Bearer <token>
```

### Clear Entire Cart
```http
DELETE /cart
Authorization: Bearer <token>
```

### Sync Cart
```http
POST /cart/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "localItems": [...]
}
```

---

## Promotions

### Get All Active Promotions
```http
GET /resource/promotions
```

**Response:**
```json
[
  {
    "_id": "promo_123",
    "name": "20% Off Pizza",
    "description": "Get 20% off all pizzas",
    "promotionType": "percentage_discount",
    "discountValue": 20,
    "scope": "restaurant",
    "applicableRestaurants": ["rest_123"],
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "isActive": true,
    "priority": 1
  }
]
```

**Promotion Types:**
- `percentage_discount`
- `fixed_discount`
- `free_delivery`
- `buy_x_get_y`
- `flash_sale`

**Scope Values:**
- `platform` - All restaurants
- `restaurant` - Specific restaurants
- `category` - Specific categories
- `item` - Specific menu items

---

## Reviews

### Get Restaurant Reviews
```http
GET /resource/reviews
```

Reviews are filtered client-side by restaurant ID and `status: 'approved'`.

---

## Settings

### Get App Settings
```http
GET /resource/settings
```

### Get Delivery Settings
```http
GET /resource/deliverysettings
```

**Response:**
```json
{
  "deliveryFeeType": "FIXED",
  "fixedDeliveryFee": 2.50,
  "dynamicDeliveryFee": {
    "baseFee": 1.50,
    "perKmFee": 0.50,
    "minFee": 1.50,
    "maxFee": 10.00
  },
  "freeDeliveryThreshold": 25.00
}
```

---

## Drivers

### Get Driver Info
```http
GET /resource/drivers/:driverId
Authorization: Bearer <token>
```

---

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message here",
  "statusCode": 400
}
```

### Common HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## Client-side API Usage

```javascript
import { api } from './api';

// Login
const response = await api.login('email@example.com', 'password');

// Get restaurants
const restaurants = await api.getRestaurants();

// Create order
const order = await api.createOrder(orderData);

// Using exported functions
import { getRestaurants, createOrder } from './api';
const restaurants = await getRestaurants();
```

---

*Last updated: March 2026*
