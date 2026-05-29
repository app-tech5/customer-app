import { ApiClient } from './client';

ApiClient.prototype.login = async function (email, password) {
  const response = await this.apiCall('/auth/customer-login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (response.token) {
    this.token = response.token;
    this.user = response.user;
    await this.saveToStorage();
  }
  return response;
};

ApiClient.prototype.register = async function (userData) {
  const response = await this.apiCall('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  return response;
};

ApiClient.prototype.logout = async function () {
  this.token = null;
  this.user = null;
  await this.clearStorage();
};

ApiClient.prototype.refreshToken = async function () {
  const response = await this.apiCall('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ token: this.token }),
  });
  if (response.token) {
    this.token = response.token;
    await this.saveToStorage();
  }
  return response;
};

ApiClient.prototype.requestPasswordReset = async function (email) {
  return await this.apiCall('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

ApiClient.prototype.resetPassword = async function (email, code, newPassword) {
  return await this.apiCall('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, newPassword }),
  });
};

ApiClient.prototype.changePassword = async function (currentPassword, newPassword) {
  return await this.apiCall('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
};
