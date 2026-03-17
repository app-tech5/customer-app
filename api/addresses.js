import { ApiClient } from './client';

/** Resource: /users/:userId/addresses */
ApiClient.prototype.getUserAddresses = async function (userId) {
  return await this.apiCall(`/users/${userId}/addresses`);
};

ApiClient.prototype.addUserAddress = async function (userId, addressData) {
  return await this.apiCall(`/users/${userId}/addresses`, {
    method: 'POST',
    body: JSON.stringify(addressData),
  });
};

ApiClient.prototype.updateUserAddress = async function (userId, addressId, addressData) {
  return await this.apiCall(`/users/${userId}/addresses/${addressId}`, {
    method: 'PUT',
    body: JSON.stringify(addressData),
  });
};

ApiClient.prototype.deleteUserAddress = async function (userId, addressId) {
  return await this.apiCall(`/users/${userId}/addresses/${addressId}`, {
    method: 'DELETE',
  });
};

ApiClient.prototype.setDefaultAddress = async function (userId, addressId) {
  return await this.apiCall(`/users/${userId}/addresses/${addressId}/default`, {
    method: 'PUT',
  });
};
