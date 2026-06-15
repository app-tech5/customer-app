
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
      return Number.isFinite(fixed) ? fixed : 0;
    }

    let fee = baseFee + distanceKm * perKmFee;
    
    if (Number.isFinite(minFee)) {
      fee = Math.max(fee, minFee);
    }

    if (Number.isFinite(maxFee)) {
      fee = Math.min(fee, maxFee);
    }

    return Number(fee.toFixed(2));
  }
  
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
