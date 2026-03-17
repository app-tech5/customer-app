import { ApiClient } from './client';

ApiClient.prototype.getSettings = async function () {
  return await this.apiCall('/resource/settings');
};

ApiClient.prototype.getAppConfig = async function () {
  try {
    return await this.apiCall('/resource/settings/app-config');
  } catch (error) {
    console.error('Error fetching app config:', error);
    return null;
  }
};
