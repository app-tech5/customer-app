# Global configuration and shared utilities

App-wide constants, theme, location helper, and small formatters. Everything is re-exported from `index.js`.

## Modules

| Module | File | Contents |
|--------|------|----------|
| Constants | `constants.js` | `language`, `currency`, `apikey`, `grey1` |
| Colors | `colors.js` | `colors` palette |
| Parameters | `parameters.js` | `parameters`, `title` layout tokens |
| Location | `location.js` | `location()` GPS helper |
| Utils | `utils.js` | Rating formatters, `generateUID`, `getDistanceFromLatLonInKm` |

## Documentation

- [Constants](docs/constants.md)
- [Colors](docs/colors.md)
- [Parameters](docs/parameters.md)
- [Location](docs/location.md)
- [Utils](docs/utils.md)

## Import examples

```js
import { language, currency, colors, grey1 } from '../global';
import { formatRestaurantRatingSummary, getDistanceFromLatLonInKm } from '../global';
```

For map/geo pipelines, prefer `utils/geoUtils` (richer helpers). `global/utils.js` still exposes a Haversine helper used by some older call sites.
