# API Reference - Good Food Pro Customer App

This document summarizes the backend endpoints used by the customer app and points to the canonical, maintained API documentation in `api/`.

---

## Configuration

```javascript
// config/index.js (root config.js re-exports for compatibility)
API_BASE_URL: 'http://localhost:5000/api'
API_TIMEOUT: 10000 // ms
```

---

## Authentication

All authenticated endpoints require the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

## Canonical docs

This repo now keeps the endpoint lists and API-layer documentation inside `api/` to avoid drift:

- **API layer overview and per-module details:** `api/README.md`
- **Compact endpoint list:** `api/docs/endpoints.md`

This `doc/api-reference.md` is intentionally kept short and stable; treat the files above as the source of truth.

## Client-side usage (current)

```js
import api from '../api';
// or
import { getRestaurants, createOrder } from '../api';
```

## Endpoint list

See `api/docs/endpoints.md`.

---

*Last updated: March 2026*
