import { ApiClient } from './client';

ApiClient.prototype.getGateways = async function () {
  return await this.apiCall('/resource/gateways');
};
