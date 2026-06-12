import { ApiClient } from './client';

ApiClient.prototype.getSettings = async function () {
  return await this.apiCall('/resource/settings');
};

ApiClient.prototype.getAppConfig = async function () {
  try {
    const data = await this.apiCall('/resource/app_settings');
    if (Array.isArray(data)) {
      return data[0] || null;
    }
    return data || null;
  } catch (error) {
    console.error('Error fetching app config:', error);
    return null;
  }
};
