# Components reference

All components under `components/` with main props and where they are used. Screens/navigation paths are from the customer-app codebase.

## home/

| Component | Main props | Used in |
|-----------|------------|---------|
| HomeHeader | (screen-dependent) | Home, SearchScreen, RestaurantSearchResults |
| HeaderTabs | – | Home, RestaurantDetail |
| SearchBar | – | Home, SignUp, RestaurantsMapScreen |
| RestaurantItems | navigation, restaurantData, flatlist?, reward?, ads?, size? | Home, SearchResults, NearMeScreen, RestaurantsMapScreen, RestaurantSearchResults |
| Categories | – | RestaurantsMapScreen |

**RestaurantItems** also exports: `RestaurantImage`, `RestaurantInfo` (used in SearchResults, NearMeScreen, RestaurantsMapScreen).

## restaurantDetail/

| Component | Main props | Used in |
|-----------|------------|---------|
| MenuItems | – | RestaurantDetail |
| ViewCart | – | RestaurantDetail, MenuDetailScreen |
| About | – | – |
| OrderItem | – | – |
| ReviewCard | – | RestaurantDetail |
| PromotionCard | – | RestaurantDetail |

## Root – cart & checkout

| Component | Main props | Used in |
|-----------|------------|---------|
| Cart | restaurantName, setViewCartButton, setModalVisible, restaurant | Used where in-restaurant cart is shown (e.g. from RestaurantDetail) |
| Checkout | restaurantName, setLoader, setViewCartButton, setModalVisible, closeModal, restaurant | CartDetailsScreen |
| CartModal | – | CartScreen |
| CartSyncWrapper | – | – |

## Root – navigation & layout

| Component | Main props | Used in |
|-----------|------------|---------|
| DrawerContent | props (DrawerContentScrollView) | DrawerNavigator |
| BackButton | – | MenuDetailScreen |
| PreferenceScreen | – | Stacks (navigation) |

## Root – forms & actions

| Component | Main props | Used in |
|-----------|------------|---------|
| AddToCartButton | food, restaurant?, style? | MenuItems, MenuDetailScreen |
| FilterModal | visible, setVisible, onApplyFilters | Screens with filter UI |

## Root – display & lists

| Component | Main props | Used in |
|-----------|------------|---------|
| RestaurantDetailComponent | – | RestaurantDetail |
| RestaurantItems (root) | – | – |
| PromotionBadge | – | RestaurantItems (home) |
| Reward | – | RestaurantsMapScreen |
| SearchComponent | – | SearchScreen |
| RestaurantName | – | – |
| RestaurantDescription | – | – |

## Root – feedback & loading

| Component | Main props | Used in |
|-----------|------------|---------|

## Root – other

| Component | Main props | Used in |
|-----------|------------|---------|
