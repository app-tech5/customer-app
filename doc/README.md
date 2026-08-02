# Documentation — Good Food Pro Customer App

Technical notes for developers working on this app. For install and first run, start with the root [`README.md`](../README.md).

## Contents

| File | Description |
|------|-------------|
| [architecture.md](./architecture.md) | Stack, folders, navigation, state, API layer |
| [api-reference.md](./api-reference.md) | Pointer to the live API docs under `api/` |

## Module docs (optional)

- `api/README.md` + `api/docs/endpoints.md`
- `components/README.md` + `components/docs/components.md`
- `config/README.md`
- `global/README.md` + `global/docs/`
- `lang/README.md` + `lang/docs/`
- `utils/README.md` + `utils/docs/`

## Quick facts

| Item | Value |
|------|--------|
| App version | 1.0.0 |
| Expo | ~54 |
| React Native | 0.81.5 |
| Demo login | `demo@customer.com` / `demo123` |

```bash
cp .env.example .env
npm install
npm run android   # first time: install development build (not Expo Go)
npm start         # later: Metro only
```

See the root [`README.md`](../README.md) Quick start for the full flow.
