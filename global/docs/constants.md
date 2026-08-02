# Constants

App-wide configuration constants. Source: `../constants.js`.

## Properties

### `language`

- **Type:** `string`
- **Value:** `"en"`
- **Meaning:** Default language code for formatting where used.
- **Imported today in:** Cart, Checkout, ViewCart, MenuItems, CartScreen, CartDetailsScreen, MenuDetailScreen, OrderRequest (and similar cart/order UI).

---

### `currency`

- **Type:** `string`
- **Value:** `"USD"`
- **Meaning:** Default currency code for price display.
- **Imported today in:** Cart, Checkout, FilterModal, RestaurantDetailComponent, PromotionCard, ViewCart, MenuItems, CartScreen, CartDetailsScreen, and several order/wallet screens that format money.

---

### `apikey`

- **Type:** `object`
- **Value:** `{}`
- **Meaning:** Legacy placeholder object. Not populated; maps do not read Google/MapTiler keys from here.
- **Used in:** Passed through some restaurant/map props historically; not a live secret store.

---

### `grey1`

- **Type:** `string`
- **Value:** `"#e6e6e6"`
- **Meaning:** Standalone light grey (distinct from `colors.grey1`, which aliases `colors.grey[700]`).
- **Used in:** `components/home/HeaderTabs.js`.
