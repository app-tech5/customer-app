import { ApiClient } from './client';

ApiClient.prototype.getOrderChat = async function (orderId) {
  return await this.apiCall(`/orders/${orderId}/chat`);
};

ApiClient.prototype.sendOrderChatMessage = async function (orderId, text) {
  return await this.apiCall(`/orders/${orderId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
};
