# Good Food Pro — Customer App

Expo / React Native customer client for the Good Food Pro food-delivery suite.
It talks to the **Good Food Pro REST API** (Express + MongoDB) for auth, restaurants, cart, checkout, and order tracking.

---

## Requirements

- Node.js **LTS** (20+ recommended)
- npm
- Expo CLI (`npx expo`)
- Android Studio and/or Xcode (native toolchain for the **development build**)
- Running **backend** API (`http://localhost:5000/api` by default)

**Expo Go is not supported.** This app uses a custom native stack (`expo-dev-client`, Stripe, MapLibre, etc.). You must install a **development build** once, then use Metro for day-to-day JS changes.

---

## Quick start

1. Configure env and install JS deps:

```bash
cd customer-app
cp .env.example .env
npm install
```

2. Start the backend (required for live data):

```bash
cd ../backend   # or my-backend, depending on your package layout
npm install
npm run migrate:up
npm start
```

Point `EXPO_PUBLIC_API_URL` in `.env` at your API (use your LAN IP instead of `localhost` on a physical device).

3. **Build & install the development client** (first time, or after native dependency changes):

```bash
cd customer-app
npm run android   # or: npm run ios
```

This runs `expo run:android` / `expo run:ios` and installs the Good Food Pro app on the emulator/device. Do **not** use Expo Go.

4. For later sessions (native app already installed), only start Metro:

```bash
npm start
```

Then open the **Good Food Pro** app already on the device/emulator (or press `a` / `i` if Expo can resolve your installed development build).

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
npm start           # Metro only (requires an installed development build)
npm run android     # Build, install, and run the Android development client
npm run ios         # Build, install, and run the iOS development client
npm run web         # Web (limited)
npm run lint        # ESLint
npm run lint-fix   # ESLint auto-fix
npm run smoke       # Local: Node 20+, npm ci, Expo config, JS export
npm run ci:hermes   # Local: hermesc on an existing export dir (default ./dist)
npm run test:hermes:smoke  # Hermes CDP login→home (Metro + debug app + adb)
```

Optional EAS builds: configure your own Expo account, then use `eas.json`.

Hermes login→home: run locally with your backend URL in `.env`, `adb`, Metro, then `npm run test:hermes:smoke`.

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
| Expo Go / QR only | Install the development build: `npm run android` or `npm run ios` |
| `unable to resolve Intent` / `exp+…://` | Development build missing or built with a different `slug`/`scheme` — rebuild with `npm run android` |
| Network request failed | Start backend; check `EXPO_PUBLIC_API_URL` |
| Demo user missing | Run backend migrations / demo seed |
| Maps blank | Check network / OSM tiles; location permission for nearby |
| Stale bundle | `npx expo start --clear` |

More detail: see `doc/`.

---

## Version

**v1.0.0** — Good Food Pro Customer App
