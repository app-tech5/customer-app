import { ApiClient } from './client';
import { buildOrderPaymentTransaction } from './walletUtils';

export { mapOrderPaymentMethod, buildOrderPaymentTransaction } from './walletUtils';

ApiClient.prototype.getUserTransactions = async function () {
  return await this.apiCall('/resource/transactions/byUserId');
};

ApiClient.prototype.addMoneyToWallet = async function (transactionData) {
  return await this.apiCall('/resource/transactions', {
    method: 'POST',
    body: JSON.stringify(transactionData),
  });
};

ApiClient.prototype.recordOrderPayment = async function ({
  userId,
  amount,
  paymentMethod,
  orderId,
}) {
  return await this.addMoneyToWallet(
    buildOrderPaymentTransaction({ userId, amount, paymentMethod, orderId })
  );
};
