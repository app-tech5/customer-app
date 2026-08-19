const React = require('react')

function StripeProvider({ children }) {
  return children
}

function CardField() {
  return null
}

function useStripe() {
  return {
    createPaymentMethod: async () => ({ error: { message: 'Stripe native SDK is not available on web demo' } }),
    confirmPayment: async () => ({ error: { message: 'Stripe native SDK is not available on web demo' } }),
    handleNextAction: async () => ({ error: { message: 'Stripe native SDK is not available on web demo' } }),
  }
}

async function confirmPayment() {
  return { error: { message: 'Stripe native SDK is not available on web demo' } }
}

async function confirmPlatformPayPayment() {
  return { error: { message: 'Stripe native SDK is not available on web demo' } }
}

module.exports = {
  StripeProvider,
  CardField,
  useStripe,
  confirmPayment,
  confirmPlatformPayPayment,
}
