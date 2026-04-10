import { ApiClient } from './client';

ApiClient.prototype.createStripePaymentIntent = async function (payload) {
  return await this.apiCall('/payments/stripe/payment-intent', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

ApiClient.prototype.attachStripePaymentMethod = async function (paymentMethodId) {
  return await this.apiCall('/payments/stripe/attach-payment-method', {
    method: 'POST',
    body: JSON.stringify({ paymentMethodId }),
  });
};
