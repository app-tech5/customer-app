import i18n from '../lang/i18n';

/** Note affichée sur les cartes (ex. « Pas encore d'avis » si review_count === 0). */
export function formatRestaurantRatingDisplay(rating, reviewCount) {
  const count = parseInt(reviewCount, 10) || 0;
  if (count === 0) {
    return i18n.t('restaurant.noReviewsYet');
  }
  const num = Number(rating);
  if (Number.isFinite(num)) {
    return num.toFixed(1);
  }
  return i18n.t('restaurant.noReviewsYet');
}

/** Ligne détail type « 4.5 (12 avis) ». */
export function formatRestaurantRatingSummary(rating, reviewCount) {
  const count = parseInt(reviewCount, 10) || 0;
  if (count === 0) {
    return i18n.t('restaurant.noReviewsYet');
  }
  const num = Number(rating);
  const ratingStr = Number.isFinite(num) ? num.toFixed(1) : '—';
  return i18n.t('restaurant.ratingWithReviews', { rating: ratingStr, count });
}

export function generateUID() {
  let firstPart = (Math.random() * 46656) | 0;
  let secondPart = (Math.random() * 46656) | 0;
  firstPart = ("000" + firstPart.toString(36)).slice(-3);
  secondPart = ("000" + secondPart.toString(36)).slice(-3);
  return firstPart + secondPart;
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

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
