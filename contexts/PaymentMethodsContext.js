import React, { createContext, useContext, useMemo, useState } from 'react'

const PaymentMethodsContext = createContext()

export function PaymentMethodsProvider({ children }) {
  const [paymentMethods, setPaymentMethods] = useState([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)

  const value = useMemo(() => ({
    paymentMethods,
    setPaymentMethods,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
  }), [paymentMethods, selectedPaymentMethod])

  return (
    <PaymentMethodsContext.Provider value={value}>
      {children}
    </PaymentMethodsContext.Provider>
  )
}

export function usePaymentMethods() {
  const context = useContext(PaymentMethodsContext)

  if (!context) {
    throw new Error('usePaymentMethods must be used within PaymentMethodsProvider')
  }

  return context
}

export default PaymentMethodsContext
