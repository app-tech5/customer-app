# Config (customer-app)

This folder contains **application configuration** and other cross-cutting constants that are not UI theme tokens (those live in `global/`).

## Goals

- Keep runtime settings (API URL, timeouts, demo mode) in one place.
- Centralize non-theme constants that are reused or should be consistent (e.g. asset URL fallbacks).
- Avoid duplicating anything from `global/` (colors, layout tokens, language/currency utilities, etc.).

## Files

| File | Exports | Purpose |
|------|---------|---------|
| `index.js` | `config`, `assetUrls` | Main configuration entrypoint |
| `assets.js` | `assetUrls` | Central asset/placeholder URLs used across UI |

## Backward compatibility

Existing imports `import { config } from '../config'` still work because the root `config.js` now re-exports from this folder.

## `config`

Source: `config/index.js`.

| Key | Type | Meaning |
|-----|------|---------|
| `API_BASE_URL` | `string` | Backend base URL (used by `api/constants.js`) |
| `APP_NAME` | `string` | Application display name |
| `VERSION` | `string` | App version (informational; not the Expo version) |
| `DEMO_MODE` | `boolean` | Enables demo behaviour (pre-filled credentials, demo flows) |
| `DEMO_EMAIL` | `string` | Demo login email |
| `DEMO_PASSWORD` | `string` | Demo login password |
| `API_TIMEOUT` | `number` | Default API timeout in ms (available for fetch wrappers) |
| `assetUrls` | `object` | Central asset URLs (see below) |

## `assetUrls`

Source: `config/assets.js`. This exists because several screens/components use remote placeholder URLs directly.

If you want to standardize visuals or switch to local placeholders later, update them here.

### Groups

- `assetUrls.placeholder.*`: image placeholders
- `assetUrls.placeholder.*` keys are named after the UI usage (e.g. `orderDetailsHero400x200`, `profileAvatar120`) to keep them self-explanatory.
- `assetUrls.icons.*`: remote icon URLs
- `assetUrls.avatars.*`: default avatar URL
- `assetUrls.demo.*`: demo-only image URLs (e.g. Preference screen)

## What is intentionally NOT here

- Theme tokens: `global/colors.js`, `global/parameters.js`
- Language and translation setup: `lang/`
- Cache configuration: `utils/cacheCommon.js` (domain-specific caching)

