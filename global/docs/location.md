# Location

Device location helper. Source: `../location.js`.

## `location()`

- **Type:** `async () => Promise<LocationObject | undefined>`
- **Behaviour:**
  - `Location.requestForegroundPermissionsAsync()`
  - If not `'granted'`, returns without a value
  - Else `Location.getCurrentPositionAsync({})`
- **Usage:** Available from `global`. Many screens call `expo-location` directly instead of this helper (e.g. restaurant / map flows). Prefer one approach per feature when editing.
