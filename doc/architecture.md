# Architecture — Good Food Customer App

## Overview

The Good Food Pro customer app is a React Native application built with Expo SDK 54. It provides a food ordering experience: browse restaurants, view menus, place orders, and track deliveries.

It is part of the Good Food suite (customer, restaurant, driver, admin) and uses a **custom REST API** (Express.js + MongoDB) as the backend—not Firebase.

---

## Tech Stack

### Core
| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.81.5 | Mobile framework |
| Expo | ~54.0.0 | Development platform |
| React | 19.1.0 | UI library |

### Navigation
| Package | Version | Purpose |
|---------|---------|---------|
| @react-navigation/native | ^7.1.26 | Navigation core |
| @react-navigation/stack | ^7.6.13 | Stack navigation |
| @react-navigation/drawer | ^7.7.10 | Drawer navigation |
| @react-navigation/bottom-tabs | ^7.9.0 | Tab navigation |

### State Management
| Package | Version | Purpose |
|---------|---------|---------|
| Redux | ^5.0.0 | Global state |
| React-Redux | ^9.0.0 | React bindings |
| React Context API | - | Local state |

### Storage & API
| Package | Version | Purpose |
|---------|---------|---------|
| AsyncStorage | 2.2.0 | Local persistence |
| Custom REST API | - | Backend communication |
| JWT Authentication | - | Secure auth |

### Maps & Location
| Package | Version | Purpose |
|---------|---------|---------|
| @maplibre/maplibre-react-native | ^11.0.2 | MapLibre map rendering |
| react-native-webview | ^13.16.1 | OpenStreetMap WebView fallback |
| expo-location | ~19.0.0 | Device location |

### Internationalization
| Package | Version | Purpose |
|---------|---------|---------|
| i18n-js | ^4.3.0 | Translations |
| expo-localization | ~17.0.0 | Device locale |

### UI Components
| Package | Version | Purpose |
|---------|---------|---------|
| react-native-reanimated | ~4.1.1 | Animations |
| react-native-gesture-handler | ~2.28.0 | Gestures |
| lottie-react-native | ~7.3.1 | Lottie animations |
| react-native-elements | ^3.4.3 | UI kit |

---

## Project Structure

```
customer-app/
├── App.js
├── app.json
├── data.js                   # Sample preference/menu demo data
├── api/                      # REST client + demo handlers
├── config/                   # Runtime config + asset URLs
├── components/
│   ├── home/                 # HomeHeader, SearchBar, RestaurantItems, …
│   ├── restaurantDetail/     # MenuItems, ViewCart, ReviewCard, …
│   ├── restaurantsMap/       # OpenStreetMap, NativeTrackingMap, …
│   └── …                     # Cart, Checkout, DrawerContent, FilterModal, …
├── screens/                  # Home, RestaurantDetail, Wallet, PreferenceScreen, …
├── navigation/               # Root, drawer, tabs, stacks
├── contexts/                 # Auth, settings, restaurants, favorites, language, …
├── redux/                    # store + cartReducer, userReducer, SignInReducer
├── lang/                     # i18n-js + en.json / fr.json
├── global/                   # colors, parameters, location helpers
├── utils/                    # cache*, geo, delivery helpers
├── assets/
├── android/
├── ios/
└── doc/
```

---

## Navigation Structure

```
RootNavigation (Stack)
├── Onboarding / Splash / SignIn / SignUp   (signed out)
└── DrawerNavigator                         (signed in)
    ├── Home tabs (Home, Search, …)
    ├── Map, Offers, Orders, Account, Wallet, Favorites, Settings
    └── Stacks for RestaurantDetail, MenuDetail, Cart, Checkout,
        OrderTracking, PreferenceScreen, Addresses, …
```

---

## State Management

### Redux
- **cartReducer** — cart lines
- **userReducer** — profile snapshot
- **SignInReducer** — auth token flag (used with auth context)

### React Contexts (wired in `navigation/navigation.js`)
- SignIn / auth, Settings, Gateway, PaymentMethods, DeliverySettings
- Restaurants, Orders, Favorites, Categories, Loader, Language
- CartSyncWrapper syncs cart with the backend when signed in

---
## API Client Architecture

The `api/` folder contains a centralized API client (`ApiClient` class) that:

1. **Authentication**: JWT-based login/logout with token persistence
2. **Auto-initialization**: Restores token from AsyncStorage on startup
3. **Header Management**: Automatic Bearer token injection

### Available API Methods

#### Authentication
- `login(email, password)`
- `register(userData)`
- `logout()`

#### Users
- `getUserInfo(userId)`
- `updateUser(userId, userData)`
- `getUserAddresses(userId)`
- `addUserAddress(userId, addressData)`
- `updateUserAddress(userId, addressId, addressData)`
- `deleteUserAddress(userId, addressId)`
- `setDefaultAddress(userId, addressId)`

#### Favorites
- `getFavorites()`
- `addToFavorites(restaurantId)`
- `removeFromFavorites(restaurantId)`

#### Wallet
- `getUserPaymentMethods(userId)`
- `addPaymentMethod(userId, data)`
- `removePaymentMethod(userId, paymentMethodId)`
- `getWalletBalance(userId)`
- `addMoneyToWallet(userId, amount, paymentMethodId)`
- `withdrawFromWallet(userId, amount, paymentMethodId)`
- `getUserTransactions(userId, page, limit)`

#### Restaurants
- `getRestaurants()`
- `getRestaurantById(id)`
- `getCategories()`
- `searchRestaurantsByCategory(categoryId)`

#### Menu & Products
- `getFoods(restaurantId)`
- `getAllMenuItems()`
- `getVariants()`

#### Orders
- `createOrder(orderData)`
- `getOrders()`
- `getOrderById(orderId)`
- `updateOrderStatus(orderId, status)`
- `cancelOrder(orderId)`

#### Cart (Server-side)
- `getCart()`
- `addToCart(itemData)`
- `removeFromCart(itemId)`
- `updateCartItem(itemId, itemData)`
- `clearCart()`
- `syncCart(localItems)`

#### Promotions
- `getAllActiveOffers()`
- `getRestaurantPromotions(restaurantId)`

#### Reviews
- `getRestaurantReviews(restaurantId)`

#### Settings
- `getSettings()`
- `getDeliverySettings()`

---

## Internationalization (i18n)

### Configuration
- Auto-detects device language via `expo-localization`
- Fallback to English if language not supported
- Currently supports: **English (en)**, **French (fr)**

### Usage
```javascript
import i18n from '../lang/i18n';

// In components
<Text>{i18n.t('auth.welcome')}</Text>

// Change language
import { changeLanguage } from '../lang/i18n';
changeLanguage('fr');
```

### Translation Keys Structure
- `app`: App metadata
- `auth`: Authentication screens
- `home`: Home screen
- `restaurant`: Restaurant details
- `menu`: Menu items
- `cart`: Cart & checkout
- `order`: Order tracking
- `wallet`: Payment & wallet
- `profile`: User profile
- `settings`: App settings
- `common`: Shared strings
- `errors`: Error messages

---

## Configuration

### `config/`
```javascript
export const config = {
  API_BASE_URL: 'http://localhost:5000/api',
  APP_NAME: 'Good Food',
  VERSION: '1.1.0',
  DEMO_MODE: true,
  DEMO_EMAIL: 'demo@customer.com',
  DEMO_PASSWORD: 'demo123',
  API_TIMEOUT: 10000,
};
```

The canonical source is `config/index.js` (env-driven via `EXPO_PUBLIC_*`).

### Asset URL fallbacks

Remote placeholder/icon/avatar URLs are centralized in `config/assets.js` as `assetUrls` and exposed as `config.assetUrls`.

### Demo Mode
When `DEMO_MODE: true`:
- Login fields are pre-filled with demo credentials
- Quick testing without manual input

---

## Key Features

### 1. Restaurant Discovery
- Browse restaurants by category
- Search by name, cuisine, or location
- Filter by rating, delivery fee, distance
- View special offers and promotions

### 2. Menu & Ordering
- Detailed menu with categories
- Product customization (variants, extras)
- Add to cart with quantity management
- Cart sync between local and server

### 3. Order Management
- Place orders with delivery/pickup options
- Real-time order tracking
- Order history with reorder feature
- Order status updates

### 4. User Account
- Profile management
- Multiple delivery addresses
- Payment methods (credit card, mobile money)
- Wallet with balance management
- Favorites management

### 5. Promotions
- Platform-wide offers
- Restaurant-specific promotions
- Category-based discounts
- Time-limited flash deals
- Free delivery offers

### 6. Maps Integration
- Restaurant locations on map
- Delivery tracking
- Nearby restaurants
- Distance calculation

---

## Scripts

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web

# Lint code
npm run lint

# Fix lint errors
npm run lint-fix
```

---

## Dependencies Overview

### Production (57 packages)
Core React Native/Expo ecosystem with navigation, maps, animations, and UI components.

### Development (8 packages)
ESLint with plugins for React, i18n, and unused imports. Husky for git hooks.

---

## Backend Integration

The app connects to a custom REST API (not Firebase):
- **Authentication**: JWT tokens
- **Database**: MongoDB
- **Server**: Express.js
- **Base URL**: Configurable via `EXPO_PUBLIC_API_URL` / `config/index.js`


---

*Last updated: March 2026*
