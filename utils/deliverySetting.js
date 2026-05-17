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
