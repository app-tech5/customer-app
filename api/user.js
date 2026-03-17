import { ApiClient } from './client';

ApiClient.prototype.getUserInfo = async function (userId) {
  return await this.apiCall(`/users/${userId}`);
};

ApiClient.prototype.updateUser = async function (userId, userData) {
  return await this.apiCall(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};

ApiClient.prototype.getProfile = async function (userId) {
  return await this.getUserInfo(userId);
};

ApiClient.prototype.updateProfile = async function (userId, userData) {
  return await this.updateUser(userId, userData);
};

ApiClient.prototype.updateAvatar = async function (userId, imageUriOrFormData) {
  return await this.apiCall(`/users/${userId}/avatar`, {
    method: 'PUT',
    body: typeof imageUriOrFormData === 'string'
      ? JSON.stringify({ avatar: imageUriOrFormData })
      : imageUriOrFormData,
  });
};
