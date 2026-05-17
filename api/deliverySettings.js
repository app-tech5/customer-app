import { ApiClient } from './client';

const DEFAULT_DELIVERY_SETTINGS = {
  fixedDeliveryFee: 2.5,
  dynamicDeliveryFee: {
    baseFee: 1.5,
    perKmFee: 0.5,
    minFee: 1.5,
    maxFee: 10,
  },
  freeDeliveryThreshold: 25,
  deliveryFeeType: 'FIXED',
};

ApiClient.prototype.getDeliverySettings = async function () {
  try {
    return await this.apiCall('/resource/deliverysettings');
  } catch (error) {
    console.error('Error fetching delivery settings:', error);
    return DEFAULT_DELIVERY_SETTINGS;
  }
};

ApiClient.prototype.getRestaurantDeliverySettings = async function (restaurantId) {
  if (!restaurantId) {
    return null;
  }
  try {
    const params = new URLSearchParams({ type: String(restaurantId) });
    const raw = await this.apiCall(`/resource/deliverysettings?${params}`);
    const list = Array.isArray(raw) ? raw : [];
    return list[0] || null;
  } catch (error) {
    console.error('Error fetching restaurant delivery settings:', error);
    return null;
  }
};

ApiClient.prototype.estimateDeliveryFee = async function (addressId, restaurantId, cartAmount) {
  try {
    const params = new URLSearchParams();
    if (addressId) params.set('addressId', addressId);
    if (restaurantId) params.set('restaurantId', restaurantId);
    if (cartAmount != null) params.set('amount', cartAmount);
    return await this.apiCall(`/resource/deliverysettings/estimate?${params}`);
  } catch (error) {
    console.error('Error estimating delivery fee:', error);
    return null;
  }
};
