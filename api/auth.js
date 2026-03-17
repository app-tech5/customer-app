import { ApiClient } from './client';

ApiClient.prototype.login = async function (email, password) {
  const response = await this.apiCall('/auth/login', {
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
  if (response.token) {
    this.token = response.token;
    this.user = response.user;
    await this.saveToStorage();
  }
  return response;
};

ApiClient.prototype.logout = async function () {
  this.token = null;
  this.user = null;
  await this.clearStorage();
};
