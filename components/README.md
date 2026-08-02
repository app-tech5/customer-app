# Components – customer-app

Reusable UI under `components/`. Screens live in `screens/` (e.g. `PreferenceScreen` is a **screen**, not a component).

## Structure

```
components/
├── home/                 Home discovery (header, search, list, promo banner, categories)
├── restaurantDetail/     Menu list, view-cart bar, reviews, promotions, …
├── restaurantsMap/       MapLibre / OSM WebView, markers, tracking helpers
└── [root]                Cart, checkout pieces, drawer, filters, badges, …
```

## `home/`

| Component | Role | Used in |
|-----------|------|---------|
| **HomeHeader** | Header / menu | Home, SearchScreen, RestaurantSearchResults |
| **HeaderTabs** | Delivery / pickup style tabs | Home, RestaurantDetail |
| **SearchBar** | Search input | Home, SignUp, RestaurantsMapScreen, EditAddressScreen |
| **RestaurantItems** | Restaurant cards (`RestaurantImage`, `RestaurantInfo`) | Home, SearchResults, NearMeScreen, RestaurantsMapScreen, RestaurantSearchResults |
| **Categories** | Category chips | Home, RestaurantsView (map) |
| **HomePromoBanner** | Home promotions banner | Home |

## `restaurantDetail/`

| Component | Role | Used in |
|-----------|------|---------|
| **MenuItems** | Menu list + cache + AddToCartButton | RestaurantDetail |
| **ViewCart** | Floating view-cart bar | RestaurantDetail, MenuDetailScreen |
| **ReviewCard** | Review row | RestaurantDetail |
| **PromotionCard** | Promotion row | RestaurantDetail |
| **About.js** | Legacy about block (also re-exports name/description) | **Not imported** by current screens (RestaurantDetail uses `RestaurantDetailComponent`) |
| **OrderItem.js** | Simple line item | **Not imported** (order screens define their own row renderers) |

## `restaurantsMap/`

| Component | Role | Used in |
|-----------|------|---------|
| **OpenStreetMap** | OSM WebView map | Map / tracking screens |
| **NativeTrackingMap** | MapLibre native tracking map | Order tracking flow |
| **MapEntityMarker** | Map markers | Map components |
| **DriverCarTopIcon** | Driver icon | Tracking map |
| **RestaurantsView** | Map + restaurant list chrome | RestaurantsMapScreen |
| **styles.js** | Shared map styles | Map components |

## Root (shared)

| Component | Role | Used in |
|-----------|------|---------|
| **Cart** | In-restaurant cart sheet | Restaurant cart flow |
| **CartModal** | Cart modal wrapper | CartScreen |
| **Checkout** | Checkout summary inside cart flow | CartDetailsScreen |
| **CheckoutPaymentSelector** | Payment method picker UI | CheckoutScreen, AddMoneyScreen |
| **CheckoutTotalActionFooter** | Total + primary CTA footer | CheckoutScreen, OrderRequest, AddMoneyScreen |
| **PaymentMethodItem** | Single payment method row | Wallet, CheckoutScreen, OrderRequest, AddMoneyScreen, CheckoutPaymentSelector |
| **CartSyncWrapper** | Syncs Redux cart ↔ API | Root signed-in tree (`navigation.js`) |
| **DrawerContent** | Drawer menu / profile / logout | DrawerNavigator |
| **AddToCartButton** | Qty + add/remove | MenuItems, MenuDetailScreen |
| **RestaurantDetailComponent** | Restaurant hero / info | RestaurantDetail |
| **RestaurantName** / **RestaurantDescription** | Name & description text | RestaurantDetailComponent (and legacy About.js) |
| **FilterModal** | Search filters | Search / filter flows |
| **SearchComponent** | Search UI | SearchScreen |
| **PromotionBadge** | Discount badge | RestaurantItems |
| **Reward** | Promo indicator on cards | RestaurantsMapScreen |
| **BackButton** | Back control | MenuDetailScreen |

## Conventions

- Styles: `StyleSheet` + often `colors` / `currency` / `language` from `../global`
- Copy: `i18n` from `../lang/i18n` (or `../../lang/i18n` in nested folders)
- Cart / user: Redux; loaders and delivery settings via contexts
- Data: `../api` and cache helpers in `../utils/cacheUtils`

## Reference

Prop / usage table: [docs/components.md](docs/components.md).
