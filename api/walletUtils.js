export const mapOrderPaymentMethod = (methodType) => {
  const map = {
    credit_card: 'credit_card',
    debit_card: 'debit_card',
    cash_on_delivery: 'cash',
    cash: 'cash',
    paypal: 'paypal',
    google_pay: 'google_pay',
    apple_pay: 'apple_pay',
    platform_credit: 'platform_credit',
  };
  return map[methodType] || 'credit_card';
};

export const buildOrderPaymentTransaction = ({
  userId,
  amount,
  paymentMethod,
  orderId,
}) => ({
  user: userId,
  transaction_type: 'customer_payment',
  amount: Number(amount) || 0,
  currency: 'USD',
  status: 'completed',
  payment_method: mapOrderPaymentMethod(paymentMethod),
  related_order: orderId,
});
