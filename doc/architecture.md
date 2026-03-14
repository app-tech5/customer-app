# Architecture - Good Food Pro Customer App

## Overview

Good Food Pro Customer App is a React Native mobile application built with Expo SDK 54. It provides a food ordering experience similar to Uber Eats, allowing customers to browse restaurants, view menus, place orders, and track deliveries.

**Good Food Pro** is a complete ecosystem with 4 apps (Customer, Restaurant, Delivery, Admin) + a custom REST API backend.

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
| react-native-maps | 1.20.1 | Map display |
| @rnmapbox/maps | ^10.2.10 | Mapbox integration |
| expo-location | ~19.0.0 | Location services |

### Internationalization
| Package | Version | Purpose |
|---------|---------|---------|
| i18n-js | ^4.3.0 | Translations |
| expo-localization | ~17.0.0 | Device locale |

### UI Components
| Package | Version | Purpose |
|---------|---------|---------|
| @gorhom/bottom-sheet | ^4.6.4 | Bottom sheets |
| react-native-reanimated | ~4.1.1 | Animations |
| react-native-gesture-handler | ~2.28.0 | Gestures |
| lottie-react-native | ~7.3.1 | Lottie animations |
| react-native-elements | ^3.4.3 | UI kit |

---

## Project Structure

```
customer-app/
├── App.js                    # Entry point
├── api.js                    # REST API client
├── config.js                 # App configuration
├── i18n.js                   # Internationalization
├── global.js                 # Global constants
├── utils.js                  # Utility functions
│
├── components/
│   ├── home/                 # Home screen components
│   │   ├── HomeHeader.js
│   │   ├── HeaderTabs.js
│   │   ├── SearchBar.js
│   │   ├── Categories.js
│   │   └── RestaurantItems.js
│   │
│   ├── restaurantDetail/     # Restaurant detail components
│   │   ├── RestaurantDetailHeader.js
│   │   ├── MenuItems.js
│   │   ├── MenuDetailItems.js
│   │   ├── ReviewCard.js
│   │   ├── PromotionCard.js
│   │   ├── About.js
│   │   ├── ViewCart.js
│   │   ├── OrderItem.js
│   │   └── TabviewComponent.js
│   │
│   ├── Cart.js               # Cart component
│   ├── CartModal.js          # Cart modal
│   ├── Checkout.js           # Checkout component
│   ├── BackButton.js         # Back navigation
│   ├── FilterModal.js        # Filter modal
│   ├── DrawerContent.js      # Drawer menu
│   ├── Loading.js            # Loading indicator
│   └── ...
│
├── screens/
│   ├── Home.js               # Home screen
│   ├── RestaurantDetail.js   # Restaurant detail
│   ├── MenuDetailScreen.js   # Menu item detail
│   ├── CartScreen.js         # Cart screen
│   ├── CheckoutScreen.js     # Checkout flow
│   ├── OrderTracking.js      # Order tracking
│   ├── MyOrdersScreen.js     # Order history
│   ├── OrderDetails.js       # Order details
│   ├── SearchScreen.js       # Search
│   ├── SearchResults.js      # Search results
│   ├── CategoryResults.js    # Category results
│   ├── ItemResults.js        # Item search results
│   ├── Offers.js             # Promotions
│   ├── WalletScreen.js       # Wallet
│   ├── AccountScreen.js      # Profile
│   ├── EditProfileScreen.js  # Edit profile
│   ├── AddressesScreen.js    # Addresses
│   ├── Settings.js           # Settings
│   ├── SignIn.js             # Login
│   ├── SignUp.js             # Registration
│   ├── Onboarding.js         # Onboarding
│   ├── Splash.js             # Splash screen
│   └── Loader.js             # Loading screen
│
├── navigation/
│   ├── navigation.js         # Root navigation
│   ├── DrawerNavigator.js    # Drawer setup
│   ├── BottomTabs.js         # Tab navigation
│   └── Stacks.js             # Stack navigators
│
├── contexts/
│   ├── authContext.js        # Authentication state
│   ├── SettingContext.js     # App settings
│   ├── DeliverySettingsContext.js  # Delivery config
│   ├── FavoritesContext.js   # Favorites
│   ├── CategoriesContext.js  # Categories
│   ├── RestaurantsContext.js # Restaurant data
│   ├── LanguageContext.js    # Language settings
│   └── LoaderContext.js      # Loading state
│
├── redux/
│   ├── store.js              # Redux store
│   └── reducers/
│       ├── index.js          # Combined reducers
│       ├── cartReducer.js    # Cart state
│       ├── userReducer.js    # User state
│       ├── SignInReducer.js  # Auth state
│       └── productsReducer.js # Products state
│
├── lang/
│   ├── en.json               # English translations
│   └── fr.json               # French translations
│
├── utils/
│   └── cacheUtils.js         # Cache utilities
│
└── doc/                      # Documentation
    ├── README.md
    ├── architecture.md
    ├── 2025-01-updates.md
    └── migration-api-firebase.md
```

---

## Navigation Structure

```
RootNavigation (Stack)
├── Onboarding
├── Splash
├── SignIn
├── SignUp
├── DrawerNavigator
│   ├── Home (BottomTabs)
│   │   ├── Home
│   │   ├── Search
│   │   └── Settings
│   ├── RestaurantsMap
│   ├── Offers
│   ├── MyOrders
│   ├── Account
│   ├── Wallet
│   ├── Favorites
│   └── Settings
├── RestaurantDetail
├── MenuDetailScreen
├── CartDetails
├── CheckoutScreen
├── OrderTracking
├── OrderDetails
├── CategoryResults
├── ItemResults
├── SearchResults
├── Wallet
├── AddCard
└── Settings
```

---

## State Management

### Redux Store
- **cart**: Shopping cart items, quantities, restaurant info
- **user**: Current user data, preferences
- **signIn**: Authentication token state
- **products**: Cached product data

### React Contexts
- **SignInContext**: Auth state & dispatch
- **SettingContext**: App settings (currency, theme)
- **DeliverySettingsContext**: Delivery fees, thresholds
- **FavoritesContext**: Favorite restaurants
- **CategoriesContext**: Food categories
- **RestaurantsContext**: Restaurant data
- **LoaderContext**: Global loading state
- **LanguageContext**: Language preferences

---

## API Client Architecture

The `api.js` file contains a centralized API client (`ApiClient` class) that:

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
import i18n from '../i18n';

// In components
<Text>{i18n.t('auth.welcome')}</Text>

// Change language
import { changeLanguage } from '../i18n';
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

### `config.js`
```javascript
export const config = {
  API_BASE_URL: 'http://localhost:5000/api',
  APP_NAME: 'Good Food',
  VERSION: '1.0.0',
  DEMO_MODE: true,
  DEMO_EMAIL: 'demo@customer.com',
  DEMO_PASSWORD: 'demo123',
  API_TIMEOUT: 10000,
};
```

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
- **Base URL**: Configurable in `config.js`

See `migration-api-firebase.md` for migration details.

---

*Last updated: March 2026*
