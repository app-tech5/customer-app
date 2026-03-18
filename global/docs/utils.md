# Utils

Shared utility functions. Source: `../utils.js`.

## `generateUID()`

- **Type:** `() => string`
- **Meaning:** Generates a short unique id (6 characters, base36). Useful for list keys or temporary ids.
- **Returns:** String of the form `"abc123"`.
- **Usage in customer-app:** Not currently imported from `global`; available for components that need a quick unique id.

---

## `getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2)`

- **Type:** `(number, number, number, number) => number`
- **Meaning:** Haversine distance between two WGS84 coordinates, in kilometres.
- **Parameters:**
  - `lat1`, `lon1` – latitude and longitude of first point (degrees).
  - `lat2`, `lon2` – latitude and longitude of second point (degrees).
- **Returns:** Distance in km.
- **Used in:** SearchResults, Home, NearMeScreen (e.g. to sort or display distance to restaurants).
