/**
 * Calcul des frais à partir d'un document API `DeliverySetting` (champs du modèle uniquement).
 */

export function calculateDeliveryFeeFromSetting(
  setting,
  distanceKm = null,
) {
  if (!setting) {
    return 0;
  }

  const {
    freeDeliveryEnabled,
    freeDeliveryThreshold,
    deliveryFeeType,
    fixedDeliveryFee,
    dynamicDeliveryFee,
    maxDeliveryDistance,
    isDeliveryEnabled,
  } = setting;

  // Livraison désactivée
  if (isDeliveryEnabled === false) {
    return null;
  }

  // Livraison gratuite globale
  if (deliveryFeeType === 'FREE' || freeDeliveryEnabled) {
    return 0;
  }

  // Vérifie la distance maximale autorisée
  if (
    distanceKm != null &&
    Number.isFinite(Number(maxDeliveryDistance)) &&
    distanceKm > Number(maxDeliveryDistance)
  ) {
    return null;
  }

  // Livraison dynamique
  if (
    ['DYNAMIC', 'RESTAURANT_DEFINED'].includes(deliveryFeeType) &&
    distanceKm != null
  ) {
    const dyn = dynamicDeliveryFee || {};

    const baseFee = Number(dyn.baseFee);
    const perKmFee = Number(dyn.perKmFee);
    const minFee = Number(dyn.minFee);
    const maxFee = Number(dyn.maxFee);

    // Fallback vers le prix fixe si données invalides
    if (!Number.isFinite(baseFee) || !Number.isFinite(perKmFee)) {
      const fixed = Number(fixedDeliveryFee);
      return Number.isFinite(fixed) ? fixed : 0;
    }

    let fee = baseFee + distanceKm * perKmFee;

    // Application min/max
    if (Number.isFinite(minFee)) {
      fee = Math.max(fee, minFee);
    }

    if (Number.isFinite(maxFee)) {
      fee = Math.min(fee, maxFee);
    }

    return Number(fee.toFixed(2));
  }

  // Livraison fixe
  const fixed = Number(fixedDeliveryFee);

  return Number.isFinite(fixed)
    ? Number(fixed.toFixed(2))
    : 0;
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
