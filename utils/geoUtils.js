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
