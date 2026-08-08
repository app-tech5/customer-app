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

ApiClient.prototype.removeStripePaymentMethod = async function (paymentMethodId) {
  return await this.apiCall('/payments/stripe/remove-payment-method', {
    method: 'POST',
    body: JSON.stringify({ paymentMethodId }),
  });
};

ApiClient.prototype.listPaymentProviders = async function () {
  return await this.apiCall('/gateways/providers', { method: 'GET' });
};

ApiClient.prototype.initializeGatewayPayment = async function (payload) {
  return await this.apiCall('/gateways/initialize', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

ApiClient.prototype.getChannelConfig = async function () {
  return await this.apiCall('/channels/config', { method: 'GET' });
};