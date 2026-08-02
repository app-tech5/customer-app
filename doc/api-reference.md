# API Reference — Good Food Pro Customer App

Short pointer to the maintained API documentation. Endpoint lists live next to the client code to avoid drift.

## Configuration

Base URL and timeout come from `config/index.js` (via `EXPO_PUBLIC_*` env vars):

```js
API_BASE_URL  // default http://localhost:5000/api
API_TIMEOUT   // default 10000 ms
```

See `.env.example` and `config/README.md`.

## Authentication

Authenticated calls send:

```
Authorization: Bearer <jwt_token>
```

## Canonical docs

| Doc | Role |
|-----|------|
| [`api/README.md`](../api/README.md) | Client architecture + per-module methods |
| [`api/docs/endpoints.md`](../api/docs/endpoints.md) | Compact endpoint list |

## Client usage

```js
import api from '../api';
// or
import { getRestaurants, createOrder } from '../api';
```
