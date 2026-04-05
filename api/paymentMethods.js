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

ApiClient.prototype.getUserPaymentMethods = async function (userId) {
  return await this.apiCall(`/users/${userId}/payment-methods`);
};

ApiClient.prototype.addPaymentMethod = async function (userId, paymentMethodData) {
  return await this.apiCall(`/users/${userId}/payment-methods`, {
    method: 'POST',
    body: JSON.stringify(paymentMethodData),
  });
};

ApiClient.prototype.removePaymentMethod = async function (userId, paymentMethodId) {
  return await this.apiCall(`/users/${userId}/payment-methods/${paymentMethodId}`, {
    method: 'DELETE',
  });
};

ApiClient.prototype.setDefaultPaymentMethod = async function (userId, paymentMethodId) {
  return await this.apiCall(
    `/users/${userId}/payment-methods/${paymentMethodId}/default`,
    { method: 'PUT' }
  );
};

ApiClient.prototype.getPaymentMethodById = async function (userId, paymentMethodId) {
  return await this.apiCall(
    `/users/${userId}/payment-methods/${paymentMethodId}`
  );
};
