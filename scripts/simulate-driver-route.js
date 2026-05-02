#!/usr/bin/env node
/**
 * Simule un déplacement driver :
 * login puis PUT /api/resource/drivers/<_id> à chaque point.
 *
 * Identifiants alignés sur config/index.js (DEMO_EMAIL / DEMO_PASSWORD).
 *
 * Usage :
 *   node scripts/simulate-driver-route.js postman-runner-data.json <driverMongoId>
 *
 * Optionnel :
 *   - API_BASE_URL (défaut http://localhost:5000/api)
 *   - SLEEP_MS (défaut 250)
 */

const fs = require("fs");
const path = require("path");

// Même valeurs que customer-app/config/index.js (DEMO_* et API_BASE_URL)
const DEFAULT_API_BASE_URL = "http://localhost:5000/api";
const DEMO_EMAIL = "demo@customer.com";
const DEMO_PASSWORD = "demo123";

function usage() {
  console.error(
    "Usage: node scripts/simulate-driver-route.js <points.json> <driverMongoId>\n" +
      "  points.json = tableau [{ latitude, longitude }, ...]\n" +
      "  Connexion automatique : " +
      DEMO_EMAIL +
      " / (mot de passe config DEMO_PASSWORD)\n" +
      "  API : " +
      DEFAULT_API_BASE_URL +
      " (override : export API_BASE_URL=...)"
  );
  process.exit(1);
}

async function login(apiBaseUrl, email, password) {
  const base = apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`;
  const loginUrl = new URL("auth/login", base);
  const res = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Login HTTP ${res.status}: ${JSON.stringify(data)}`);
  }
  if (!data.token) {
    throw new Error("Réponse login sans token.");
  }
  return data.token;
}

async function main() {
  const [, , pointsFileArg, driverIdArg] = process.argv;
  if (!pointsFileArg || !driverIdArg) usage();

  const apiBaseUrl = (process.env.API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");
  const email = process.env.DEMO_EMAIL || DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD || DEMO_PASSWORD;

  const pointsPath = path.isAbsolute(pointsFileArg)
    ? pointsFileArg
    : path.join(process.cwd(), pointsFileArg);

  const driverId = String(driverIdArg).trim();
  const sleepMs = Math.max(0, Number(process.env.SLEEP_MS || 250) || 250);

  let points;
  try {
    points = JSON.parse(fs.readFileSync(pointsPath, "utf8"));
  } catch (e) {
    console.error("Impossible de lire le JSON :", pointsPath, e.message);
    process.exit(1);
  }
  if (!Array.isArray(points)) {
    console.error("Le fichier doit être un tableau JSON [{ latitude, longitude }, ...].");
    process.exit(1);
  }

  console.error(`→ Login ${email} …`);
  const token = await login(apiBaseUrl, email, password);
  console.error("→ Login OK");

  const putUrl = `${apiBaseUrl}/resource/drivers/${driverId}`;
  console.error(`→ ${points.length} points, PUT ${putUrl} (sleep=${sleepMs}ms)`);

  for (let i = 0; i < points.length; i += 1) {
    const { latitude: lat, longitude: lng } = points[i] || {};
    if (![lat, lng].every(Number.isFinite)) {
      console.error(`Ligne ${i + 1} ignorée (lat/lng invalides).`);
      continue;
    }

    const body = JSON.stringify({
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
    });

    const res = await fetch(putUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
    });

    const text = await res.text();
    if (!res.ok) {
      console.error(`[${i + 1}/${points.length}] HTTP ${res.status}`, text);
      process.exit(1);
    }
    console.error(`[${i + 1}/${points.length}] OK (${lat}, ${lng})`);
    if (sleepMs > 0 && i < points.length - 1) {
      await new Promise((r) => setTimeout(r, sleepMs));
    }
  }

  console.error("Terminé.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
