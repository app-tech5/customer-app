# Good Food — Customer App

React Native application for online food ordering. It talks to your **Good Food REST API** (Express.js + MongoDB) for authentication, restaurants, cart, checkout, and order tracking.

This repo is the **updated Good Food customer app**: self-hosted API and database, same codebase you ship as the buyer-facing mobile client in the suite.

---

## Table of Contents

- [Features](#features) 
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Demo Mode](#demo-mode)
- [Internationalization](#internationalization)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)

---

## Features

- User authentication (sign up / sign in)
- Restaurant discovery and search
- Menu browsing with categories
- Shopping cart management
- Order placement and tracking
- Geolocation and maps
- Wallet and payment methods
- Favorites management
- Multilingual interface (EN/FR)
- Demo mode (auto-login)
- Promotions and offers

---

## Tech Stack

### Core
| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.81.5 | Mobile framework |
| Expo | ~54.0.0 | Development platform |
| React | 19.1.0 | UI library |

### Navigation
| Package | Version |
|---------|---------|
| @react-navigation/native | ^7.1.26 |
| @react-navigation/stack | ^7.6.13 |
| @react-navigation/drawer | ^7.7.10 |
| @react-navigation/bottom-tabs | ^7.9.0 |

### State Management
| Package | Version | Purpose |
|---------|---------|---------|
| Redux | ^5.0.0 | Global state |
| React-Redux | ^9.0.0 | React bindings |
| React Context | - | Local state |
| AsyncStorage | 2.2.0 | Persistence |

### Maps & Location
| Package | Version |
|---------|---------|
| react-native-maps | 1.20.1 |
| @rnmapbox/maps | ^10.2.10 |
| expo-location | ~19.0.0 |

### UI & Animations
| Package | Version |
|---------|---------|
| react-native-reanimated | ~4.1.1 |
| @gorhom/bottom-sheet | ^4.6.4 |
| lottie-react-native | ~7.3.1 |
| react-native-elements | ^3.4.3 |

### Internationalization
| Package | Version |
|---------|---------|
| i18n-js | ^4.3.0 |
| expo-localization | ~17.0.0 |

---

## Installation

### Prerequisites
- Node.js ≥ 16
- npm or yarn
- Expo CLI
- Android Studio (Android) or Xcode (iOS)

### Setup
```bash
cd customer-app

# Install dependencies
npm install

# Start development server
npm start
```

### Backend Setup
This app requires the **my-backend** server running:
```bash
cd ../my-backend
npm install
npm run migrate:up
npm start
```

---

## Configuration

### API Configuration
Edit `config/index.js` (or keep importing from `config.js` for compatibility):

```javascript
export const config = {
  API_BASE_URL: 'http://localhost:5000/api',
  APP_NAME: 'Good Food',
  VERSION: '1.1.0',
  DEMO_MODE: true,
  DEMO_EMAIL: 'demo@customer.com',
  DEMO_PASSWORD: 'demo123',
  API_TIMEOUT: 10000,
  assetUrls: { /* see config/assets.js */ },
};
```

### Environment Options
| Variable | Description | Default |
|----------|-------------|---------|
| `API_BASE_URL` | Backend API URL | `http://localhost:5000/api` |
| `DEMO_MODE` | Enable demo credentials | `true` |
| `API_TIMEOUT` | Request timeout (ms) | `10000` |

---

## Project Structure

```
customer-app/
├── App.js                    # Entry point
├── api/                      # API layer (client + endpoints)
├── config/                   # App configuration (runtime + assets)
├── config.js                 # Re-export for backward compatibility
├── global/                   # Global constants & theme tokens (no inline comments)
├── lang/                     # i18n setup + translations
│
├── components/               # 41 reusable components
│   ├── home/                 # Home screen components
│   │   ├── HomeHeader.js
│   │   ├── SearchBar.js
│   │   ├── Categories.js
│   │   └── RestaurantItems.js
│   │
│   ├── restaurantDetail/     # Restaurant detail components
│   │   ├── MenuItems.js
│   │   ├── ReviewCard.js
│   │   ├── PromotionCard.js
│   │   └── ViewCart.js
│   │
│   ├── Cart.js
│   ├── Checkout.js
│   ├── FilterModal.js
│   └── ...
│
├── screens/                  # 34 screens
│   ├── Home.js
│   ├── RestaurantDetail.js
│   ├── MenuDetailScreen.js
│   ├── CartScreen.js
│   ├── CheckoutScreen.js
│   ├── OrderTracking.js
│   ├── MyOrdersScreen.js
│   ├── SearchScreen.js
│   ├── WalletScreen.js
│   ├── AccountScreen.js
│   ├── Settings.js
│   ├── SignIn.js
│   ├── SignUp.js
│   └── ...
│
├── navigation/
│   ├── navigation.js         # Root navigation
│   ├── DrawerNavigator.js
│   ├── BottomTabs.js
│   └── Stacks.js
│
├── contexts/                 # 8 React contexts
│   ├── authContext.js
│   ├── SettingContext.js
│   ├── DeliverySettingsContext.js
│   ├── FavoritesContext.js
│   ├── CategoriesContext.js
│   └── ...
│
├── redux/
│   ├── store.js
│   └── reducers/
│       ├── cartReducer.js
│       ├── userReducer.js
│       └── ...
│
├── lang/
│   ├── en.json               # English translations
│   └── fr.json               # French translations
│
├── utils/
│   ├── cacheUtils.js         # Barrel re-export (compat)
│   ├── cacheCommon.js        # Shared cache config/helpers
│   ├── cacheFoods.js
│   ├── cacheRestaurants.js
│   ├── cachePromotions.js
│   ├── cacheMenus.js
│   ├── cacheSignIn.js
│   └── cacheCleanup.js
│
└── doc/                      # Documentation
    ├── README.md
    ├── architecture.md
    ├── api-reference.md
    └── ...
```

---

## Demo Mode

### Configuration
Demo mode pre-fills login credentials for easy testing.

**Enable:** Set `DEMO_MODE: true` in `config.js`

**Demo Credentials:**
- **Email:** `demo@customer.com`
- **Password:** `demo123`

### Features
- Auto-filled login fields
- Visual indicator "Demo Mode - Pre-filled credentials"
- One-click login
- Demo user auto-created in database

---

## Internationalization

### Supported Languages
- English (default)
- French

### Auto-Detection
The app automatically detects device language using `expo-localization`.

### Usage
```javascript
import i18n from '../lang/i18n';

// Simple text
<Text>{i18n.t('auth.welcome')}</Text>

// With parameters
<Text>{i18n.t('order.estimatedTime', { minutes: 25 })}</Text>
```

### Change Language
```javascript
import { changeLanguage } from '../lang/i18n';
changeLanguage('en'); // English
changeLanguage('fr'); // French
```

### Translation Keys
| Category | Example Keys |
|----------|--------------|
| `auth` | welcome, signIn, signUp, email, password |
| `home` | title, searchPlaceholder, categories |
| `restaurant` | menu, reviews, addToCart, viewCart |
| `cart` | title, empty, checkout, total |
| `order` | tracking, status, estimatedTime |
| `wallet` | balance, addMoney, paymentMethods |
| `settings` | language, notifications, logout |
| `common` | save, cancel, loading, error |

---

## Scripts

```bash
npm start          # Start Expo dev server
npm run android    # Build and run on Android
npm run ios        # Build and run on iOS
npm run web        # Run in web browser
npm run lint       # Check code quality
npm run lint-fix   # Auto-fix lint errors
```

---

## Troubleshooting

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Network request failed" | API server not running | Start backend with `npm start` |
| "User not found" | Demo user missing | Run `npm run migrate:up` on backend |
| "component auth has not been registered" | Stale or bad imports | Check navigation registration and imports |
| "useLegacyImplementation prop" | Navigation/Reanimated conflict | Update React Navigation to v7 |
| "cannot read property split of undefined" | i18n locale issue | Already fixed with fallback |

### Cache Issues
```bash
# Clear Expo cache
npx expo start --clear

# Clear npm cache
npm cache clean --force
rm -rf node_modules
npm install
```

### API Connection Issues
1. Check `config.js` has correct `API_BASE_URL`
2. Ensure backend server is running
3. Check network/firewall settings
4. For physical device, use local IP instead of `localhost`

---

## Documentation

### Detailed Documentation
See the [`/doc`](./doc/) folder for complete documentation, and module-level docs in:

- `api/README.md` + `api/docs/`
- `components/README.md` + `components/docs/`
- `global/README.md` + `global/docs/`
- `lang/README.md` + `lang/docs/`
- `config/README.md`

| File | Description |
|------|-------------|
| [README.md](./doc/README.md) | Documentation index |
| [architecture.md](./doc/architecture.md) | Technical architecture |
| [api-reference.md](./doc/api-reference.md) | API endpoints reference |
| [2025-01-updates.md](./doc/2025-01-updates.md) | January 2025 updates |
| [migration-api-firebase.md](./doc/migration-api-firebase.md) | Firebase migration guide |

---

## User Flow

```
Onboarding → SignIn/SignUp → Home → RestaurantDetail → Cart → Checkout → OrderTracking
```

### Navigation Structure
```
RootNavigation (Stack)
├── Onboarding
├── SignIn / SignUp
├── DrawerNavigator
│   ├── Home (BottomTabs)
│   ├── Search
│   ├── MyOrders
│   ├── Account
│   ├── Wallet
│   ├── Favorites
│   └── Settings
├── RestaurantDetail
├── MenuDetailScreen
├── CheckoutScreen
├── OrderTracking
└── ...
```

---

## Suite

This app is the **customer** client in the Good Food ecosystem. Run your backend, point `config/index.js` at `API_BASE_URL`, and use it alongside the restaurant, driver, and admin apps that share the same API.

---

## Version

**v1.1.0** — Good Food customer app update (March 2026)

---

## License

This project is under MIT License.

---

*Last updated: March 2026*
