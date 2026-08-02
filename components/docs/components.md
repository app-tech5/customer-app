# Components reference

Files under `components/` with main props and current call sites. Prefer this over guessing from filenames.

## home/

| Component | Main props | Used in |
|-----------|------------|---------|
| HomeHeader | screen-dependent | Home, SearchScreen, RestaurantSearchResults |
| HeaderTabs | activeTab / tab handlers | Home, RestaurantDetail |
| SearchBar | search handlers | Home, SignUp, RestaurantsMapScreen, EditAddressScreen |
| RestaurantItems | `navigation`, `restaurantData`, optional `flatlist`, `reward`, `ads`, `size` | Home, SearchResults, NearMeScreen, RestaurantsMapScreen, RestaurantSearchResults |
| Categories | category selection | Home, RestaurantsView |
| HomePromoBanner | `promotions`, `navigation` | Home |

Also exports from RestaurantItems: `RestaurantImage`, `RestaurantInfo`.

## restaurantDetail/

| Component | Main props | Used in |
|-----------|------------|---------|
| MenuItems | restaurant / scroll props | RestaurantDetail |
| ViewCart | cart visibility / navigation | RestaurantDetail, MenuDetailScreen |
| ReviewCard | review fields | RestaurantDetail |
| PromotionCard | promotion fields | RestaurantDetail |
| About | restaurant props | *(unused import path today)* |
| OrderItem | `name`, `quantity`, `items` | *(unused import path today)* |

## restaurantsMap/

| Component | Role | Used in |
|-----------|------|---------|
| OpenStreetMap | OSM WebView | Map / tracking |
| NativeTrackingMap | MapLibre tracking | Order tracking |
| MapEntityMarker | Markers | Map stack |
| DriverCarTopIcon | Driver glyph | Tracking |
| RestaurantsView | Map shell | RestaurantsMapScreen |

## Root – cart & checkout

| Component | Main props | Used in |
|-----------|------------|---------|
| Cart | `restaurantName`, visibility setters, `restaurant` | In-restaurant cart |
| Checkout | `restaurantName`, modal setters, `restaurant`, delivery setting | CartDetailsScreen |
| CartModal | – | CartScreen |
| CartSyncWrapper | `children` | `navigation/navigation.js` |
| CheckoutPaymentSelector | payment list + selection handlers | CheckoutScreen, AddMoneyScreen |
| CheckoutTotalActionFooter | totals + CTA | CheckoutScreen, OrderRequest, AddMoneyScreen |
| PaymentMethodItem | method display / press | Wallet, CheckoutScreen, OrderRequest, AddMoneyScreen, CheckoutPaymentSelector |

## Root – navigation & display

| Component | Main props | Used in |
|-----------|------------|---------|
| DrawerContent | drawer props | DrawerNavigator |
| BackButton | – | MenuDetailScreen |
| AddToCartButton | `food`, optional `restaurant`, `style` | MenuItems, MenuDetailScreen |
| FilterModal | `visible`, `setVisible`, `onApplyFilters` | Filter UI screens |
| RestaurantDetailComponent | restaurant payload | RestaurantDetail |
| RestaurantName | `name` | RestaurantDetailComponent |
| RestaurantDescription | `description` | RestaurantDetailComponent |
| PromotionBadge | promo fields | RestaurantItems |
| Reward | restaurant | RestaurantsMapScreen |
| SearchComponent | search UI | SearchScreen |

**Note:** `screens/PreferenceScreen.js` is registered in navigation stacks — it is not under `components/`.
