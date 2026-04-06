import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

const PaymentMethodsContext = createContext()

export function PaymentMethodsProvider({ children }) {
  const [paymentMethods, setPaymentMethods] = useState([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)

  const addPaymentMethod = useCallback((method) => {
    const isFirstPaymentMethod = paymentMethods.length === 0
    const nextMethod = {
      ...method,
      isDefault: isFirstPaymentMethod,
    }
    const next = [...paymentMethods, nextMethod]

    setPaymentMethods(next)

    if (isFirstPaymentMethod) {
      setSelectedPaymentMethod(nextMethod)
    }
  }, [paymentMethods])

  const setDefaultPaymentMethod = useCallback((methodId) => {
    const next = paymentMethods.map((method, index) => {
      const currentId = method._id || method.id || `method_${index}`
      return {
        ...method,
        isDefault: currentId === methodId,
      }
    })

    setPaymentMethods(next)
    setSelectedPaymentMethod(next.find((method) => method.isDefault) || null)
  }, [paymentMethods])

  const removePaymentMethod = useCallback((methodId) => {
    const filtered = paymentMethods.filter((method, index) => {
      const currentId = method._id || method.id || `method_${index}`
      return currentId !== methodId
    })

    const hasDefault = filtered.some((method) => method.isDefault)
    const next = hasDefault
      ? filtered
      : filtered.map((method, index) => ({
          ...method,
          isDefault: index === 0,
        }))

    setPaymentMethods(next)
    setSelectedPaymentMethod(next.find((method) => method.isDefault) || null)
  }, [paymentMethods])

  const value = useMemo(() => ({
    paymentMethods,
    setPaymentMethods,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    addPaymentMethod,
    setDefaultPaymentMethod,
    removePaymentMethod,
  }), [
    paymentMethods,
    selectedPaymentMethod,
    addPaymentMethod,
    setDefaultPaymentMethod,
    removePaymentMethod,
  ])

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
