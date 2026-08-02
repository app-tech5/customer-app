# Components – customer-app

This folder contains reusable UI components for the customer app. Documenting them here makes onboarding easier and keeps usage consistent across screens and navigation.

## Structure

```
components/
├── README.md           (this file)
├── docs/
│   └── components.md   (reference: props, used in)
├── home/               Home & discovery (list, search, categories)
├── restaurantDetail/   Restaurant page (menu, cart bar, reviews, promotions)
└── [shared]            Cart, checkout, drawer, modals, buttons, etc.
```

## Subfolders

### `home/`

Components used on the home flow, search, and map/list of restaurants.

| Component | Role | Used in |
|-----------|------|---------|
| **HomeHeader** | Header with menu / branding | Home, SearchScreen (Menu), RestaurantSearchResults |
| **HeaderTabs** | Tabs (e.g. list / map) | Home, RestaurantDetail |
| **SearchBar** | Search input | Home, SignUp, RestaurantsMapScreen |
| **RestaurantItems** | FlatList of restaurant cards; exports `RestaurantImage`, `RestaurantInfo` | Home, SearchResults, NearMeScreen, RestaurantsMapScreen, RestaurantSearchResults |
| **Categories** | Category chips/filters | RestaurantsMapScreen |

### `restaurantDetail/`

Components used on the restaurant detail and menu flow.

| Component | Role | Used in |
|-----------|------|---------|
| **MenuItems** | Menu list with categories, search, cache; uses AddToCartButton | RestaurantDetail |
| **ViewCart** | Floating “View cart” bar (count, total, navigate to cart) | RestaurantDetail, MenuDetailScreen |
| **About** | About section | – |
| **OrderItem** | Single order line item | – |
| **ReviewCard** | One review card | RestaurantDetail |
| **PromotionCard** | One promotion card | RestaurantDetail |

### Root (shared)

| Component | Role | Used in |
|-----------|------|---------|
| **Cart** | Slide-up cart modal: items, total, delivery summary, checkout entry. Redux cart + DeliverySettingsContext. | Rendered from screens that need in-restaurant cart (e.g. RestaurantDetail flow) |
| **Checkout** | Checkout form/summary inside cart: totals, place order. Uses LoaderContext, Redux user/cart, DeliverySettingsContext. | CartDetailsScreen |
| **CartModal** | Wrapper / modal for cart UI | CartScreen |
| **CartSyncWrapper** | Syncs local cart with backend | – |
| **DrawerContent** | Custom drawer content: profile, sign out, nav items. Uses Redux user, api.logout. | DrawerNavigator |
| **AddToCartButton** | Add/remove from cart with quantity; uses Redux + addToCart API. Requires `food`, optional `restaurant`, `style`. | MenuItems, MenuDetailScreen |
| **RestaurantDetailComponent** | Main restaurant info block (name, image, etc.) | RestaurantDetail |
| **FilterModal** | Filters: sort, max delivery fee, price range, cuisine, features. `visible`, `setVisible`, `onApplyFilters`. | Screens that need search filters |
| **SearchComponent** | Search UI (input + results handling) | SearchScreen |
| **PreferenceScreen** | User preferences screen (can be used as a screen) | Stacks (navigation) |
| **PromotionBadge** | Badge for promotion/discount on a card | RestaurantItems |
| **Reward** | Reward indicator on restaurant card | RestaurantsMapScreen |
| **BackButton** | Back navigation button | MenuDetailScreen |
| **RestaurantName** | Restaurant name display | – |
| **RestaurantDescription** | Restaurant description | – |

## Conventions

- **Styling:** Components use `StyleSheet` and often import `colors` (and sometimes `currency`, `language`) from `../global`.
- **i18n:** Use `i18n` from `../i18n` for all user-facing strings.
- **State:** Cart and user come from Redux (`cartReducer`, `userReducer`). Some flows use `LoaderContext`, `DeliverySettingsContext`, `CategoriesContext`.
- **API:** Components that need data call the `api` (or named functions) from `../api`; menu data may use `loadFoodsWithSmartCache` from `../utils/cacheUtils`.

## Reference

For a compact table of all components with main props and “used in” locations, see [docs/components.md](docs/components.md).
