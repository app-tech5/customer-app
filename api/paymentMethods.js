import { ApiClient } from './client';

export const createCardPaymentMethod = async (createPaymentMethod, holderName) => {
  const { paymentMethod, error } = await createPaymentMethod({
    paymentMethodType: 'Card',
    billingDetails: {
      name: holderName.trim(),
    },
  });

  return { paymentMethod, error };
};

ApiClient.prototype.getUserPaymentMethods = async function () {
  return await this.apiCall('/resource/paymentMethods');
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
