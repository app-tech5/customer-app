import { ApiClient } from './client';

ApiClient.prototype.createOrder = async function (orderData) {
  return await this.apiCall('/resource/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
};

ApiClient.prototype.getOrders = async function () {
  const response = await this.apiCall('/resource/orders');
  return response.map((order) => ({
    id: order._id || order.id,
    ...order,
  }));
};

ApiClient.prototype.getOrderById = async function (orderId) {
  const order = await this.apiCall(`/resource/orders/${orderId}`);
  if (!order) return order;
  return {
    id: order._id || order.id,
    ...order,
  };
};

ApiClient.prototype.updateOrderStatus = async function (orderId, status) {
  return await this.apiCall(`/resource/orders/${orderId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};

ApiClient.prototype.cancelOrder = async function (orderId) {
  return await this.updateOrderStatus(orderId, 'cancelled');
};

ApiClient.prototype.getOrderTracking = async function (orderId) {
  return await this.apiCall(`/resource/orders/${orderId}/tracking`);
};

ApiClient.prototype.rateOrder = async function (orderId, rating, comment) {
  return await this.apiCall(`/resource/orders/${orderId}/rate`, {
    method: 'POST',
    body: JSON.stringify({ rating, comment: comment || '' }),
  });
};

ApiClient.prototype.reorder = async function (orderId) {
  return await this.apiCall(`/resource/orders/${orderId}/reorder`, {
    method: 'POST',
  });
};
