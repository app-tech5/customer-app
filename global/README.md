# Global configuration and shared utilities

This folder holds app-wide constants, theme (colors and layout parameters), and shared utilities. Everything is re-exported from `index.js`, so you can import from `../global` or `../../global` as before.

## Modules

| Module        | File           | Contents |
|---------------|----------------|----------|
| Constants     | `constants.js` | `language`, `currency`, `apikey`, `grey1` |
| Colors        | `colors.js`    | `colors` (full palette) |
| Parameters    | `parameters.js`| `parameters`, `title` (layout / buttons) |
| Location      | `location.js`  | `location()` (device GPS) |
| Utils         | `utils.js`     | `generateUID`, `getDistanceFromLatLonInKm` |

## Documentation

Detailed property documentation (meaning, usage in the app, and conventions) is in the **`docs/`** folder:

- [Constants](docs/constants.md) – language, currency, API key, grey1
- [Colors](docs/colors.md) – full color palette, grey scale, auth, legacy aliases
- [Parameters](docs/parameters.md) – header height, styled button, title styles
- [Location](docs/location.md) – location helper
- [Utils](docs/utils.md) – generateUID, getDistanceFromLatLonInKm

## Import examples

```js
import { language, currency, colors } from '../global';
import { getDistanceFromLatLonInKm } from '../global';
import { grey1 } from '../global';
```
