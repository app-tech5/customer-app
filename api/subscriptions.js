import { ApiClient } from './client';

ApiClient.prototype.listSubscriptionPlans = async function (target) {
  const query = target ? `?target=${encodeURIComponent(target)}` : '';
  return await this.apiCall(`/subscriptions${query}`);
};

ApiClient.prototype.getMySubscription = async function () {
  return await this.apiCall('/subscriptions/mine');
};

ApiClient.prototype.getSubscriptionBenefits = async function () {
  return await this.apiCall('/subscriptions/mine/benefits');
};

ApiClient.prototype.subscribeToPlan = async function (planId) {
  return await this.apiCall(`/subscriptions/${planId}/subscribe`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
};

ApiClient.prototype.cancelMySubscription = async function () {
  return await this.apiCall('/subscriptions/mine/cancel', {
    method: 'POST',
    body: JSON.stringify({}),
  });
};
