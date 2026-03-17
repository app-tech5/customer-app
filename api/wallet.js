import { ApiClient } from './client';

ApiClient.prototype.getUserTransactions = async function (userId, page = 1, limit = 20) {
  return await this.apiCall(
    `/users/${userId}/transactions?page=${page}&limit=${limit}`
  );
};

ApiClient.prototype.getWalletBalance = async function (userId) {
  return await this.apiCall(`/users/${userId}/wallet/balance`);
};

ApiClient.prototype.addMoneyToWallet = async function (userId, amount, paymentMethodId) {
  return await this.apiCall(`/users/${userId}/wallet/add-money`, {
    method: 'POST',
    body: JSON.stringify({ amount, paymentMethodId }),
  });
};

ApiClient.prototype.withdrawFromWallet = async function (
  userId,
  amount,
  paymentMethodId
) {
  return await this.apiCall(`/users/${userId}/wallet/withdraw`, {
    method: 'POST',
    body: JSON.stringify({ amount, paymentMethodId }),
  });
};

ApiClient.prototype.getTransactionById = async function (userId, transactionId) {
  return await this.apiCall(`/users/${userId}/transactions/${transactionId}`);
};
