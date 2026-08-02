# Config (customer-app)

Application configuration and shared non-UI constants.

## Files

| File | Exports | Purpose |
|------|---------|---------|
| `index.js` | `config`, `assetUrls`, `PUBLIC_UPLOAD_FOLDERS` | Runtime settings |
| `assets.js` | `assetUrls` | Placeholder / demo image URLs |

Import with:

```js
import { config } from '../config';
```

## `config` keys

| Key | Meaning |
|-----|---------|
| `API_BASE_URL` | Backend API base (`EXPO_PUBLIC_API_URL`) |
| `APP_NAME` | Display name |
| `VERSION` | App version label |
| `DEMO_MODE` | Prefill demo login when not `false` |
| `DEMO_EMAIL` / `DEMO_PASSWORD` | Demo credentials |
| `FALLBACK_STRIPE_PUBLISHABLE_KEY` | Stripe key fallback |
| `MAPTILER_API_KEY` | Maps key |
| `assetUrls` | Central remote/local asset URLs |

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_*` values for your environment.

## `assetUrls`

Groups:

- `placeholder.*` — image placeholders
- `icons.*` — icon URLs
- `avatars.*` — default avatar
- `demo.*` — demo-only images (e.g. Preference screen)

Prefer updating URLs here instead of hardcoding them in screens.

## Not in this folder

- Theme tokens → `global/`
- i18n → `lang/`
- Cache → `utils/cacheCommon.js`
