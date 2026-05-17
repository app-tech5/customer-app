/**
 * Calcul des frais à partir d'un document API `DeliverySetting` (champs du modèle uniquement).
 */

export function calculateDeliveryFeeFromSetting(setting, distanceKm = null) {
  if (!setting) {
    return null;
  }

  if (setting.deliveryFeeType === 'FREE' || setting.freeDeliveryEnabled) {
    return 0;
  }

  if (
    (setting.deliveryFeeType === 'DYNAMIC' || setting.deliveryFeeType === 'RESTAURANT_DEFINED') &&
    distanceKm != null &&
    setting.dynamicDeliveryFee
  ) {
    const dyn = setting.dynamicDeliveryFee;
    const baseFee = Number(dyn.baseFee);
    const perKmFee = Number(dyn.perKmFee);
    if (!Number.isFinite(baseFee) || !Number.isFinite(perKmFee)) {
      const fixed = Number(setting.fixedDeliveryFee);
      return Number.isFinite(fixed) ? fixed : 0;
    }
    const calculated = baseFee + distanceKm * perKmFee;
    const minFee = Number(dyn.minFee);
    const maxFee = Number(dyn.maxFee);
    const min = Number.isFinite(minFee) ? minFee : calculated;
    const max = Number.isFinite(maxFee) ? maxFee : calculated;
    return Math.min(Math.max(calculated, min), max);
  }

  const fixed = Number(setting.fixedDeliveryFee);
  return Number.isFinite(fixed) ? fixed : 0;
}

export function usesDynamicDeliveryFee(setting) {
  if (!setting) return false;
  return (
    setting.deliveryFeeType === 'DYNAMIC' || setting.deliveryFeeType === 'RESTAURANT_DEFINED'
  );
}

export function hasDeliverySetting(setting) {
  return !!(setting && (setting._id || setting.deliveryFeeType != null));
}

/** Détail affichage DYNAMIC : tous les champs de `dynamicDeliveryFee` + total après min/max. */
export function getDynamicDeliveryFeeBreakdown(setting, distanceKm = null) {
  const dyn = setting?.dynamicDeliveryFee;
  if (!dyn || typeof dyn !== 'object') {
    return null;
  }

  const baseFee = Number(dyn.baseFee);
  const perKmFee = Number(dyn.perKmFee);
  const minFee = Number(dyn.minFee);
  const maxFee = Number(dyn.maxFee);

  const base = Number.isFinite(baseFee) ? baseFee : 0;
  const perKm = Number.isFinite(perKmFee) ? perKmFee : 0;
  const min = Number.isFinite(minFee) ? minFee : null;
  const max = Number.isFinite(maxFee) ? maxFee : null;

  const km = distanceKm != null && Number.isFinite(Number(distanceKm)) ? Number(distanceKm) : null;
  const distancePart = km != null ? km * perKm : null;
  const subtotal = km != null ? base + distancePart : null;

  let total = subtotal;
  if (subtotal != null) {
    const floor = min != null ? min : subtotal;
    const ceiling = max != null ? max : subtotal;
    total = Math.min(Math.max(subtotal, floor), ceiling);
  }

  return {
    baseFee: base,
    perKmFee: perKm,
    minFee: min,
    maxFee: max,
    distanceKm: km,
    distancePart,
    subtotal,
    total,
    minApplied: subtotal != null && min != null && total === min && subtotal < min,
    maxApplied: subtotal != null && max != null && total === max && subtotal > max,
  };
}
