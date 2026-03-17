import { ApiClient } from './client';

/** Resource: /users/:userId */
ApiClient.prototype.getUserInfo = async function (userId) {
  return await this.apiCall(`/users/${userId}`);
};

ApiClient.prototype.updateUser = async function (userId, userData) {
  return await this.apiCall(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};
