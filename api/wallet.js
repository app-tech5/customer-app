import { ApiClient } from './client';

ApiClient.prototype.getUserTransactions = async function () {
  return await this.apiCall('/resource/transactions/byUserId');
};

ApiClient.prototype.addMoneyToWallet = async function (transactionData) {
  return await this.apiCall('/resource/transactions', {
    method: 'POST',
    body: JSON.stringify(transactionData),
  });
};
