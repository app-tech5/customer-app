# Config (customer-app)

Runtime settings and shared non-theme constants.

## Files

| File | Exports | Purpose |
|------|---------|---------|
| `index.js` | `config`, `assetUrls`, `PUBLIC_UPLOAD_FOLDERS` | Main configuration |
| `assets.js` | `assetUrls` | Placeholder / demo image URLs |

## `config` (`index.js`)

| Key | Meaning |
|-----|---------|
| `API_BASE_URL` | Backend API base URL |
| `APP_NAME` | Display name |
| `VERSION` | App version string |
| `DEMO_MODE` | Prefill demo login when true |
| `DEMO_EMAIL` / `DEMO_PASSWORD` | Demo credentials |
| `FALLBACK_STRIPE_PUBLISHABLE_KEY` | Stripe key fallback |
| `MAPTILER_API_KEY` | MapTiler key |
| `API_TIMEOUT` | Request timeout (ms) |
| `assetUrls` | See `assets.js` |

Values come from `EXPO_PUBLIC_*` (see `.env.example`).

```bash
cp .env.example .env
# edit EXPO_PUBLIC_API_URL for your backend
```

## `assetUrls`

Remote placeholders used when a local image is missing. Prefer updating keys here rather than hardcoding URLs in screens.

## Not in this folder

- Theme tokens → `global/`
- i18n → `lang/`
- Cache → `utils/cacheCommon.js`
