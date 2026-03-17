import { ApiClient } from './client';

/** Resource: /resource/deliverysettings */
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
