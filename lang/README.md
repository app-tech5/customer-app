# Language and translations (lang/)

This folder holds the app’s i18n setup and translation files. All user-facing strings should go through the `i18n` instance so the app can switch between English and French (or other locales) consistently.

## Contents

| File / folder | Role |
|---------------|------|
| **i18n.js** | i18n instance (i18n-js), locale detection, fallback, and helpers |
| **en.json** | English translations (namespaced keys) |
| **fr.json** | French translations (same structure as en.json) |
| **docs/** | Key reference and usage in the app |

## i18n.js – behaviour (documentation of former comments)

- **Translation files:** Imports `en` and `fr` from `./en.json` and `./fr.json` and passes them to the i18n-js `I18n` constructor.
- **Fallback:** `enableFallback = true` so that if a key is missing in the current locale, the default locale is used.
- **Default locale:** `defaultLocale = 'en'`.
- **Device language:** Uses `expo-localization`’s `Localization.locale`; the first part (e.g. `fr` from `fr-FR`) is used. If that locale exists in `translations`, it is set; otherwise the code falls back to `'fr'` when the device language is unsupported (see `lang/i18n.js`). Prefer `changeLanguage()` for explicit switches.
- **Setting locale:** `i18n.locale` is set once at load. Use `changeLanguage(locale)` to switch at runtime.

## Exports from i18n.js

| Export | Type | Description |
|--------|------|-------------|
| **default** | `I18n` instance | Use `i18n.t('key')` or `i18n.t('namespace.key')` for translated strings. Optional second argument: default string or interpolation object. |
| **changeLanguage** | `(language: string) => void` | Sets `i18n.locale` if the language is in `translations`; otherwise logs a warning. |
| **getCurrentLanguage** | `() => string` | Returns current `i18n.locale`. |
| **isLanguageSupported** | `(language: string) => boolean` | Returns whether the language exists in `translations`. |
| **supportedLanguages** | `string[]` | Keys of `i18n.translations` (e.g. `['en', 'fr']`). |

## Usage in the app

Import the default instance (or helpers) from `lang/i18n`:

```js
import i18n from '../lang/i18n';   // from screens/, components/, contexts/, navigation/, utils/

i18n.t('cart.title');              // "Your Cart" (en) / "Votre panier" (fr)
i18n.t('auth.email');              // "Email"
i18n.t('search.resultsFor', { query: 'pizza' });  // interpolation
i18n.t('order.status.title', 'Order Status');     // with default string
```

**Where i18n is used (customer-app):** utils (cache*), screens (cart, orders, auth, search, wallet, profile, checkout, settings, etc.), components (Cart, Checkout, DrawerContent, FilterModal, MenuItems, ViewCart, SearchBar, …), contexts (SettingContext, DeliverySettingsContext), navigation (DrawerNavigator). See [docs/keys-and-usage.md](docs/keys-and-usage.md) for a key-to-usage map.

## Translation file structure (en.json / fr.json)

Keys are grouped by feature. Main namespaces:

- **app** – App name, version  
- **cache** – Cache error/warning messages (save, read, clear, invalid data, cleanup, sign-in)  
- **navigation** – Tab/drawer labels (restaurants, search, settings, …)  
- **drawer** – Drawer menu (home, map, offers, my orders, account, wallet, favorites, logout, …)  
- **search** – Search UI (placeholders, results, filters, categories, distance, loading, errors)  
- **filters** – Filter modal (sort, max delivery fee, price range, cuisine, features, apply)  
- **auth** – Sign in / sign up (email, password, placeholders, errors, success)  
- **home** – Home screen (title, subtitle, sections, nearby, popular, categories)  
- **tabs** – Delivery / Pickup  
- **restaurant** – Restaurant detail (menu, reviews, delivery time, add to cart, view cart, rating, offers)  
- **menu** – Product details (options, ingredients, customization, availability)  
- **cart** – Cart and checkout (title, empty, items, options, order summary, delivery fee, tax)  
- **order** – Orders (place order, tracking, status, reorder, filters, empty state, details)  
- **payment** – Payment method labels and status  
- **delivery** – Delivery / Pickup  
- **wallet** – Wallet screen (balance, add money, payment methods, transactions, promo codes)  
- **profile** – Profile and edit profile (name, email, phone, save, notifications, addresses)  
- **addresses** – Address list and form (add, default, delete, tips)  
- **checkout** – Checkout screen (address, payment, place order)  
- **settings** – Settings screen (language, notifications, logout, about, help)  
- **common** – Shared (save, cancel, back, loading, retry, preparingExperience, loadingDeliciousOptions)  
- **onboarding** – Onboarding copy  
- **preference** – Meal/preference choice  
- **progress** – Progress steps (placeholder content)  
- **errors** – Generic and context errors (network, settings, delivery)  
- **offers** – Offers screen (available at, valid until, loading deals)  
- **promotion** – Promotion badges (valid until, discount, free delivery)  

Interpolation uses `{{variable}}` in the JSON (e.g. `{{count}}`, `{{query}}`, `{{name}}`). Pass the object as the second argument to `i18n.t()`.

## LanguageContext (contexts/LanguageContext.js)

The app also has a `LanguageContext` that imports `en.json` and `fr.json` directly and exposes a flat object per language (via `useTranslation()`). That context is separate from the `lang/i18n.js` instance: screens/components that use `i18n.t()` rely on `lang/i18n.js`; any component using `useTranslation()` uses the context’s copy of the JSON. For a single source of truth, prefer `i18n` from `lang/i18n` for new code.

## Adding or changing translations

1. Edit **en.json** and **fr.json** (same keys in both).
2. Use dot notation for namespaces: `"cart.title"`, `"order.status.pending"`.
3. For interpolation, use `{{name}}` in the value and pass `{ name: '...' }` as the second argument to `i18n.t()`.
4. After adding new keys, you can document them in [docs/keys-and-usage.md](docs/keys-and-usage.md).

## Reference

- [docs/keys-and-usage.md](docs/keys-and-usage.md) – Key-to-location map (which keys are used in which files).
