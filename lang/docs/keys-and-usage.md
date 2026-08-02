# Translation keys – where they are used

This file maps **namespaces** (and representative keys) to **files** in customer-app that call `i18n.t(...)` with those keys. Use it to find where a key is used or to add new keys in the right namespace.

## By namespace

- **cache.*** – Utils: `cacheCommon`, `cacheFoods`, `cacheRestaurants`, `cachePromotions`, `cacheMenus`, `cacheSignIn`, `cacheCleanup`. Messages for save/read/clear errors, invalid data, cleanup, sign-in, email update.
- **cart.*** – Screens: CartDetailsScreen. Components: Cart, Checkout. Keys: title, items, empty, addItems, backToMenu, each, options, orderSummary, item, itemsSuffix, subtotal, deliveryFee, tax, free, deliverTo, etc.
- **common.*** – Loader screen (preparingExperience, loadingDeliciousOptions), and shared labels (save, cancel, back, loading, retry, etc.).
- **navigation.***, **drawer.*** – DrawerNavigator, DrawerContent (menu labels, home, search, map, offers, my orders, account, wallet, favorites, settings, logout).
- **search.*** – SearchScreen, SearchResults, RestaurantsMapScreen, NearMeScreen, CategoryResults, ItemResults, SearchComponent, home/SearchBar, home/HeaderTabs. Keys: placeholders, noResults, loading, categories, distance, list, map, etc.
- **filters.*** – FilterModal (title, sortBy, maxDeliveryFee, priceRange, cuisine, features, apply).
- **auth.*** – SignIn, SignUp (email, password, placeholders, errors, login, register).
- **home.*** – Home, RestaurantsMapScreen, Offers (title, subtitle, sections, nearby, popular, categories).
- **restaurant.*** – RestaurantDetail, RestaurantDetailComponent, restaurantDetail/MenuItems, ViewCart, ReviewCard, PromotionCard, About (menu, reviews, addToCart, viewCart, total, deliveryTime, rating, etc.).
- **menu.*** – MenuDetailScreen, restaurantDetail/MenuItems (product, options, ingredients, category, customization).
- **order.*** – OrderRequest, OrderTracking, OrderDetails, OrdersScreen, MyOrdersScreen (placeOrder, tracking, status, details, reorder, empty state, filters).
- **wallet.*** – WalletScreen, Wallet (title, balance, payment methods, transactions, promo codes).
- **profile.*** – AccountScreen, EditProfileScreen (title, edit, name, email, phone, save, updateSuccess, addresses, notifications).
- **addresses.*** – AddressesScreen (title, add address, default, delete, tips).
- **checkout.*** – CheckoutScreen (title, delivery address, payment method, place order).
- **settings.*** – Settings, PreferenceScreen, SettingContext (title, language, notifications, logout, about).
- **errors.*** – DeliverySettingsContext, SettingContext (deliverySettingsLoad, settingsLoad, context errors).
- **offers.***, **promotion.*** – Offers screen, PromotionCard (availableAt, validUntil, discount, freeDelivery).

## Usage pattern

- **Screens:** Most screens import `i18n` from `../lang/i18n` and use `i18n.t('namespace.key')` for titles, buttons, empty states, and errors.
- **Components (root):** Import from `../lang/i18n`.
- **Components (home/, restaurantDetail/):** Import from `../../lang/i18n`.
- **Utils / contexts:** Import from `../lang/i18n` (relative to utils/ or contexts/).

## Adding a new key

1. Add the key to **en.json** and **fr.json** under the right namespace (e.g. `cart.newKey`).
2. Use it with `i18n.t('cart.newKey')` or `i18n.t('cart.newKey', 'Default text')`.
3. For interpolation: in JSON use `"Message with {{var}}"` and call `i18n.t('namespace.key', { var: value })`.
4. Optionally add the file/location to this doc under the namespace.
