# Constants

App-wide configuration constants. Source: `../constants.js`.

## Properties

### `language`

- **Type:** `string`
- **Value:** `"en"`
- **Meaning:** Default app language code. Used for formatting and locale-aware behaviour.
- **Used in:** CartDetailsScreen, OrderRequest, MenuDetailScreen, CartScreen, Size, MenuItems (restaurantDetail), OrderListItem, Checkout, FilterModal, Cart.

---

### `currency`

- **Type:** `string`
- **Value:** `"USD"`
- **Meaning:** Default currency code for prices and payments.
- **Used in:** CartDetailsScreen, OrderRequest, MenuDetailScreen, CartScreen, Size, MenuItems, RestaurantDetailComponent, OrderListItem, Checkout, FilterModal, Cart.

---

### `apikey`

- **Type:** `object`
- **Value:** `{}`
- **Meaning:** Placeholder for external API keys (e.g. Google API). Fill with your key(s) where needed.
- **Used in:** Not referenced in current codebase; reserved for future map or other services.

---

### `grey1`

- **Type:** `string`
- **Value:** `"#e6e6e6"`
- **Meaning:** Standalone grey token (light grey). Distinct from `colors.grey1` (which is darker, alias for grey.700).
- **Used in:** GroupFoodHeader.
