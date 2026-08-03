
export function calculateDeliveryFeeFromSetting(
  setting,
  distanceKm = null,
  options = {},
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

  const surgeMultiplier = Number(options.surgeMultiplier);
  const applySurge =
    Number.isFinite(surgeMultiplier) && surgeMultiplier > 1 ? surgeMultiplier : 1;
  
  if (isDeliveryEnabled === false) {
    return null;
  }
  
  if (deliveryFeeType === 'FREE' || freeDeliveryEnabled) {
    return 0;
  }
  
  if (
    distanceKm != null &&
    Number.isFinite(Number(maxDeliveryDistance)) &&
    distanceKm > Number(maxDeliveryDistance)
  ) {
    return null;
  }
  
  let fee = 0;

  if (
    ['DYNAMIC', 'RESTAURANT_DEFINED'].includes(deliveryFeeType) &&
    distanceKm != null
  ) {
    const dyn = dynamicDeliveryFee || {};

    const baseFee = Number(dyn.baseFee);
    const perKmFee = Number(dyn.perKmFee);
    const minFee = Number(dyn.minFee);
    const maxFee = Number(dyn.maxFee);
    
    if (!Number.isFinite(baseFee) || !Number.isFinite(perKmFee)) {
      const fixed = Number(fixedDeliveryFee);
      fee = Number.isFinite(fixed) ? fixed : 0;
    } else {
      fee = baseFee + distanceKm * perKmFee;
    
      if (Number.isFinite(minFee)) {
        fee = Math.max(fee, minFee);
      }

      if (Number.isFinite(maxFee)) {
        fee = Math.min(fee, maxFee);
      }
    }
  } else {
    const fixed = Number(fixedDeliveryFee);
    fee = Number.isFinite(fixed) ? fixed : 0;
  }

  if (applySurge > 1 && fee > 0) {
    fee = fee * applySurge;
  }

  return Number(fee.toFixed(2));
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
