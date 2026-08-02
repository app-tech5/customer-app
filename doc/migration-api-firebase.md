# Firebase → REST API Migration

## What changed

* Firebase Auth / Firestore / Storage were removed from the runtime path
* The app now uses a **custom REST API** (Express.js + MongoDB) with JWT + AsyncStorage
* `api/index.js` still exposes small **compatibility helpers** (`signInWithEmailAndPassword`, `db`, `storage`, etc.) so older snippets and docs remain understandable while everything hits the REST client underneath

## Why it matters for buyers

You own the backend and data. No Firebase billing lock-in for core auth/catalog/orders.

## Result

Independent customer app wired to the Good Food Pro backend, with demo mode for offline/local evaluation.
