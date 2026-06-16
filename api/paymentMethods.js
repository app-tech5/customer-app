import { ApiClient } from './client';

export const createCardPaymentMethod = async (_createPaymentMethod, holderName, cardNumber = '') => {
  const digits = String(cardNumber).replace(/\D/g, '')
  const last4 = digits.slice(-4) || '4242'

  return {
    paymentMethod: {
      id: `demo_pm_${Date.now()}`,
      Card: {
        last4,
        brand: 'visa',
      },
      billingDetails: {
        name: holderName.trim(),
      },
    },
    error: null,
  };
};

ApiClient.prototype.getUserPaymentMethods = async function () {
  return await this.apiCall('/resource/paymentMethods/byUserId');
};

ApiClient.prototype.addPaymentMethod = async function (paymentMethodData) {
  return await this.apiCall('/resource/paymentMethods', {
    method: 'POST',
    body: JSON.stringify(paymentMethodData),
  });
};

ApiClient.prototype.removePaymentMethod = async function (paymentMethodId) {
  return await this.apiCall(`/resource/paymentMethods/${paymentMethodId}`, {
    method: 'DELETE',
  });
};

ApiClient.prototype.setDefaultPaymentMethod = async function (paymentMethodId) {
  return await this.apiCall(`/resource/paymentMethods/${paymentMethodId}`, {
    method: 'PUT',
    body: JSON.stringify({ isDefault: true }),
  });
};

ApiClient.prototype.getPaymentMethodById = async function (paymentMethodId) {
  return await this.apiCall(`/resource/paymentMethods/${paymentMethodId}`);
};

ApiClient.prototype.updatePaymentMethod = async function (paymentMethodId, paymentMethodData) {
  return await this.apiCall(`/resource/paymentMethods/${paymentMethodId}`, {
    method: 'PUT',
    body: JSON.stringify(paymentMethodData),
  });
};
