# Location

Device location helper. Source: `../location.js`.

## `location()`

- **Type:** `async () => Promise<LocationObject | undefined>`
- **Meaning:** Requests foreground location permission and returns the current position. Uses `expo-location`. Returns `undefined` if permission is denied.
- **Behaviour:**
  - Calls `Location.requestForegroundPermissionsAsync()`.
  - If status is not `'granted'`, returns without value.
  - Otherwise returns the result of `Location.getCurrentPositionAsync({})`.
- **Usage in customer-app:** Not imported from `global` in current codebase; `RestaurantDetail.js` uses `expo-location` directly for map coordinates. Available for any screen that needs a one-shot current position from global.
