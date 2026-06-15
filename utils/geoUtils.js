export const bearing = (φ1, λ1, φ2, λ2) => {
  const x = Math.sin((λ2 - λ1) * Math.PI / 180) * Math.cos(φ2 * Math.PI / 180);
  const y = Math.cos(φ1 * Math.PI / 180) * Math.sin(φ2 * Math.PI / 180) -
    Math.sin(φ1 * Math.PI / 180) * Math.cos(φ2 * Math.PI / 180) * Math.cos((λ2 - λ1) * Math.PI / 180);
  const θ = Math.atan2(x, y);
  return (θ * 180 / Math.PI + 360) % 360;
};

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export function parseGeoCoordinate(value) {
  if (value == null || value === '') return NaN;
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? n : NaN;
}

export function isUsableGeoCoordinate(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return false;
  if (lat === 0 && lon === 0) return false;
  return true;
}

export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getDistanceBetweenPointsInKm(fromPoint, toPoint) {
  if (!fromPoint || !toPoint) return null;

  const fromLat = Number(fromPoint.latitude);
  const fromLng = Number(fromPoint.longitude);
  const toLat = Number(toPoint.latitude);
  const toLng = Number(toPoint.longitude);

  if (![fromLat, fromLng, toLat, toLng].every(Number.isFinite)) {
    return null;
  }

  return getDistanceFromLatLonInKm(fromLat, fromLng, toLat, toLng);
}

export function getPointFromLocation(location) {
  const coordinates = location?.coordinates;
  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    const longitude = Number(coordinates[0]);
    const latitude = Number(coordinates[1]);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude };
    }
  }

  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return { latitude, longitude };
  }

  return null;
}

export function getGeoJsonPointFromSocketPayload(payload) {
  const coordinates = payload?.location?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return null;
  }

  const longitude = Number(coordinates[0]);
  const latitude = Number(coordinates[1]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    type: 'Point',
    coordinates: [longitude, latitude],
  };
}

function distancePointToSegmentKm(lat, lng, lat1, lon1, lat2, lon2) {
  const refLat = deg2rad((lat1 + lat2 + lat) / 3);
  const ky = 111.32;
  const kx = 111.32 * Math.cos(refLat);
  const ax = (lon1 - lng) * kx;
  const ay = (lat1 - lat) * ky;
  const bx = (lon2 - lng) * kx;
  const by = (lat2 - lat) * ky;
  const wx = bx - ax;
  const wy = by - ay;
  const len2 = wx * wx + wy * wy;
  if (len2 < 1e-20) {
    return Math.hypot(ax, ay);
  }
  let t = -(ax * wx + ay * wy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * wx;
  const cy = ay + t * wy;
  return Math.hypot(cx, cy);
}

export function bearingAlongPolylineNearPoint(lat, lng, points) {
  if (!Array.isArray(points) || points.length < 2) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  let bestDist = Infinity;
  let bestBearing = null;

  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const lat1 = Number(a.latitude);
    const lon1 = Number(a.longitude);
    const lat2 = Number(b.latitude);
    const lon2 = Number(b.longitude);
    if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) continue;

    const d = distancePointToSegmentKm(lat, lng, lat1, lon1, lat2, lon2);
    if (d < bestDist) {
      bestDist = d;
      bestBearing = bearing(lat1, lon1, lat2, lon2);
    }
  }

  return bestBearing;
}
