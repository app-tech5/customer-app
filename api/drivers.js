import { ApiClient } from './client';

ApiClient.prototype.getDriverInfo = async function (driverId) {
  return await this.apiCall(`/resource/drivers/${driverId}`);
};

ApiClient.prototype.getDriverLocation = async function (driverId, orderId) {
  try {
    const query = orderId ? `?orderId=${orderId}` : '';
    return await this.apiCall(`/resource/drivers/${driverId}/location${query}`);
  } catch (error) {
    console.error('Error fetching driver location:', error);
    return null;
  }
};
