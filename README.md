# Good Food Pro — Customer App

Expo / React Native customer client for the Good Food Pro food-delivery suite.
It talks to the **Good Food Pro REST API** (Express + MongoDB) for auth, restaurants, cart, checkout, and order tracking.

---

## Requirements

- Node.js **LTS** (20+ recommended)
- npm
- Expo CLI (`npx expo`)
- Android Studio and/or Xcode for device builds
- Running **backend** API (`http://localhost:5000/api` by default)

---

## Quick start

```bash
cd customer-app
cp .env.example .env
npm install
npm start
```

Then press `a` (Android) or `i` (iOS), or scan the QR code with Expo Go / your dev client.

### Backend

Start the suite backend first:

```bash
cd ../backend   # or my-backend, depending on your package layout
npm install
npm run migrate:up
npm start
```

Point `EXPO_PUBLIC_API_URL` in `.env` at your API (use your LAN IP instead of `localhost` on a physical device).

---

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `EXPO_PUBLIC_DEMO_MODE` | Prefill demo login | `true` |
| `EXPO_PUBLIC_DEMO_EMAIL` | Demo email | `demo@customer.com` |
| `EXPO_PUBLIC_DEMO_PASSWORD` | Demo password | `demo123` |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | _(empty)_ |
| `EXPO_PUBLIC_MAPTILER_API_KEY` | Unused by current maps (OSM / MapLibre); kept in env template only | _(empty)_ |

Runtime config lives in `config/index.js` (reads the env vars above).

### Demo credentials

- **Email:** `demo@customer.com`
- **Password:** `demo123`

Set `EXPO_PUBLIC_DEMO_MODE=false` for production builds.

### App identity

Edit `app.json` before store submission:

- `expo.name`
- `expo.android.package`
- `expo.ios.bundleIdentifier`
- icons / splash under `assets/`

---

## Project structure

```
customer-app/
├── App.js              # Entry
├── data.js             # Sample preference data
├── app.json            # Expo config
├── .env.example        # Env template
├── api/                # REST client + demo handlers
├── assets/             # Images, lottie, fonts
├── components/         # UI components
├── config/             # API / demo / assets config
├── contexts/           # React contexts
├── doc/                # Extra technical docs
├── global/             # Theme / shared constants
├── lang/               # i18n (EN / FR)
├── navigation/         # Navigators
├── redux/              # Cart / user state
├── screens/            # Screens
├── utils/              # Helpers / cache
├── android/            # Native Android project
└── ios/                # Native iOS project
```

---

## Scripts

```bash
npm start           # Expo dev server
npm run android     # Build & run Android
npm run ios         # Build & run iOS
npm run web         # Web (limited)
npm run lint        # ESLint
npm run lint-fix   # ESLint auto-fix
npm run smoke       # Buyer smoke: Node 20+, npm ci, Expo config, JS export
```

CI (GitHub Actions): `.github/workflows/buyer-smoke.yml` runs the same checks on push/PR.

Optional EAS builds: configure your own Expo account, then use `eas.json`.

---

## Tech stack

- Expo ~54 / React Native 0.81 / React 19
- React Navigation 7
- Redux + redux-persist
- MapLibre / OpenStreetMap (WebView tracking & restaurant map)
- Stripe React Native
- socket.io-client
- i18n-js (EN / FR)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Network request failed | Start backend; check `EXPO_PUBLIC_API_URL` |
| Demo user missing | Run backend migrations / demo seed |
| Maps blank | Check network / OSM tiles; location permission for nearby |
| Stale bundle | `npx expo start --clear` |

More detail: see `doc/`.

---

## Version

**v1.0.0** — Good Food Pro Customer App
