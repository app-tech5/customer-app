# Architecture — Good Food Pro Customer App

## Overview

React Native customer client (Expo SDK 54) for the Good Food Pro suite: browse restaurants, order food, pay, and track deliveries.

Backend: **custom REST API** (Express + MongoDB) with JWT auth — not Firebase. Real-time updates use **socket.io-client** (restaurants / orders contexts).

---

## Tech stack (from `package.json`)

### Core

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.81.5 | Mobile framework |
| Expo | ~54.0.0 | Tooling / native modules |
| React | 19.1.0 | UI |

### Navigation

| Package | Version |
|---------|---------|
| @react-navigation/native | ^7.1.26 |
| @react-navigation/stack | ^7.6.13 |
| @react-navigation/drawer | ^7.7.10 |
| @react-navigation/bottom-tabs | ^7.9.0 |

### State & storage

| Package | Version | Purpose |
|---------|---------|---------|
| redux | ^5.0.0 | Cart / user reducers |
| react-redux | ^9.0.0 | Bindings |
| redux-persist | ^6.0.0 | Persist store (+ `PersistGate`) |
| @react-native-async-storage/async-storage | 2.2.0 | Tokens, cache, persist |
| React Context | – | Auth, catalogs, settings, i18n language, etc. |

### Maps & location

| Package | Version | Purpose |
|---------|---------|---------|
| @maplibre/maplibre-react-native | ^11.0.2 | Native MapLibre map |
| react-native-webview | ^13.16.1 | OpenStreetMap WebView map |
| expo-location | ~19.0.0 | Device location |

`EXPO_PUBLIC_MAPTILER_API_KEY` / `config.MAPTILER_API_KEY` exist in config but are **not used** by the current map UI (OSM / MapLibre only).

### Payments, realtime, i18n

| Package | Version | Purpose |
|---------|---------|---------|
| @stripe/stripe-react-native | 0.50.3 | Cards / PaymentSheet flows |
| socket.io-client | ^4.8.3 | Live restaurant / order updates |
| i18n-js | ^4.3.0 | Translations |
| expo-localization | ~17.0.0 | Device locale |

### UI

| Package | Version |
|---------|---------|
| react-native-reanimated | ~4.1.1 |
| react-native-gesture-handler | ~2.28.0 |
| lottie-react-native | ~7.3.1 |
| react-native-elements | ^3.4.3 |

**Dependency counts:** 37 production / 7 development packages in `package.json` (no Husky).

---

## Project structure

```
customer-app/
├── App.js
├── app.json
├── data.js                 # Preference / sample choice data
├── api/                    # REST client, demo handlers, domain modules
├── config/                 # Runtime config + asset URL fallbacks
├── components/
│   ├── home/
│   ├── restaurantDetail/
│   ├── restaurantsMap/     # MapLibre + OSM WebView + markers
│   └── …                   # Cart, checkout, drawer, filters, …
├── screens/
├── navigation/             # Root stack, drawer, tabs, section stacks
├── contexts/               # Auth, settings, catalogs, favorites, language, …
├── redux/                  # store (persisted) + cart/user reducers + cart actions
├── lang/                   # i18n-js + en.json / fr.json
├── global/                 # colors, constants, location, rating formatters
├── utils/                  # cache*, geo, delivery, map helpers, image pick, …
├── assets/
├── android/
├── ios/
└── doc/
```

---

## Navigation

```
RootNavigation (stack)  — navigation/navigation.js
├── Onboarding / Splash / SignIn / SignUp     (signed out)
└── (signed in, wrapped in CartSyncWrapper + contexts)
    ├── DrawerNavigator
    │   ├── BottomTabs → Home | Search | Cart | Orders | Account stacks
    │   ├── NearMe
    │   ├── Offers
    │   ├── Wallet section stack
    │   ├── Settings section stack (Settings, Preference, Help, About, …)
    │   └── Drawer redirects into tabs (Search / Orders / Account)
    ├── OrderCompleted
    ├── SearchFlow / WalletFlow / CheckoutFlow / OrderStatusFlow
    └── CategoryResults / ItemResults
```

Home stack also reaches RestaurantDetail, MenuDetail, map, favorites, addresses, etc. (see `navigation/Stacks.js`).

---

## State management

### Redux (`redux/`)

- **cartReducer** — cart lines (persisted)
- **userReducer** — profile snapshot (persisted)
- **SignInReducer** — used from `contexts/authContext.js` (not a separate persisted slice in the same way)
- **actions/cartActions.js** — cart mutations used with sync

Store uses `redux-persist` + AsyncStorage (`redux/store.js`).

### Contexts (`contexts/`)

Wired from `navigation/navigation.js`: auth, Settings, Gateway, PaymentMethods, DeliverySettings, Restaurants, Orders, Favorites, Categories, Loader, Language.

`CartSyncWrapper` syncs the Redux cart with the backend when signed in.

`RestaurantsContext` / `OrdersContext` open socket.io connections to the API host.

---

## API layer

Centralized in `api/` (`ApiClient` + domain modules). Full method/path tables: [`api/README.md`](../api/README.md) and [`api/docs/endpoints.md`](../api/docs/endpoints.md).

Important corrections vs older notes:

- Customer login path is **`POST /auth/customer-login`** (not `/auth/login`).
- Users live under **`/resource/users/...`**.
- Products under **`/resource/products?...`**.
- Payment methods under **`/resource/paymentMethods/...`**.
- Transactions under **`/resource/transactions/...`** (no separate wallet balance/withdraw client methods).
- App config: **`GET /resource/app_settings`**.
- Stripe helpers: **`/payments/stripe/...`**.
- Upload: **`POST /upload/public`**.

---

## Internationalization

- `lang/i18n.js` (i18n-js) + `en.json` / `fr.json`
- Device locale via `expo-localization`; if the language code is not in translations, initial locale falls back to **`fr`** (missing keys still fall back via `defaultLocale = 'en'`)
- Prefer `i18n.t(...)` from `lang/i18n` for new UI
- `LanguageContext` also loads the JSON files for a separate `useTranslation()` path — prefer `lang/i18n` as the single source of truth for new code

Namespaces in the JSON files include: `app`, `cache`, `navigation`, `drawer`, `search`, `filters`, `auth`, `home`, `tabs`, `restaurant`, `menu`, `cart`, `order`, `payment`, `delivery`, `wallet`, `profile`, `addresses`, `checkout`, `settings`, `common`, `onboarding`, `preference`, `progress`, `errors`, `offers`, `promotion`, `about`, `help`, `map`.

---

## Configuration (`config/index.js`)

Env-driven via `EXPO_PUBLIC_*` (see `.env.example`):

| Key | Role |
|-----|------|
| `API_BASE_URL` | Backend base (default `http://localhost:5000/api`) |
| `APP_NAME` / `VERSION` | Display metadata (`Good Food Pro` / `1.0.0`) |
| `DEMO_MODE` / demo credentials | Prefill login + demo API handlers |
| `FALLBACK_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key fallback |
| `MAPTILER_API_KEY` | Reserved; unused by current maps |
| `API_TIMEOUT` | Timeout constant |
| `assetUrls` | Remote placeholder URLs (`config/assets.js`) |

---

## Key product areas

1. **Discovery** — home list, search, filters, near me, map, categories, offers  
2. **Ordering** — restaurant menu, variants, cart (local + server sync), checkout  
3. **Orders** — place, track (map), history, reorder/rate APIs  
4. **Account** — profile, addresses, favorites, settings, preferences  
5. **Wallet / payments** — payment methods, Stripe, transactions / add money  
6. **Maps** — restaurant map + delivery tracking (MapLibre / OSM WebView)

---

## Scripts

```bash
npm run android   # first-time / native: install development build
npm run ios
npm start         # Metro only (dev client must already be installed)
npm run web
npm run lint
npm run lint-fix
```

**Not Expo Go** — requires `expo-dev-client` (see root README Quick start).

Optional EAS: `eas.json` (bring your own Expo account).

Hermes CDP login→home is run locally with `adb` + Metro against the buyer’s own API URL in `.env`.

---

## Backend integration

| Concern | Detail |
|---------|--------|
| Auth | JWT Bearer |
| DB | MongoDB (server-side) |
| Server | Express.js |
| Base URL | `EXPO_PUBLIC_API_URL` → `config.API_BASE_URL` |
| Realtime | socket.io against API origin |

---

*Last updated: August 2026 — verified against customer-app sources*
