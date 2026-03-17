import { ApiClient } from './client';

/** Resource: /resource/orders, /resource/settings, /resource/drivers */
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

ApiClient.prototype.getSettings = async function () {
  return await this.apiCall('/resource/settings');
};

ApiClient.prototype.getOrderById = async function (orderId) {
  return await this.apiCall(`/resource/orders/${orderId}`);
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

ApiClient.prototype.getDriverInfo = async function (driverId) {
  return await this.apiCall(`/resource/drivers/${driverId}`);
};
