import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  removeStripePaymentMethod,
  getUserPaymentMethods,
  addPaymentMethod as addPaymentMethodApi,
  removePaymentMethod as removePaymentMethodApi,
} from '../api'

const PaymentMethodsContext = createContext()

export function PaymentMethodsProvider({ children }) {
  const user = useSelector((state) => state.userReducer)
  const [paymentMethods, setPaymentMethods] = useState([])

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const paymentMethods = await getUserPaymentMethods()
        setPaymentMethods(paymentMethods)
      } catch (error) {
        console.warn('Failed to load payment methods from API', error)
      }
    }
  
    fetchPaymentMethods()
  }, [])

  const addPaymentMethod = useCallback(async (method) => {

    const isFirstPaymentMethod = paymentMethods.length === 0
    const nextMethod = {
      ...method,
      isDefault: isFirstPaymentMethod,
    }

    const paymentMethod = await addPaymentMethodApi({
      ...nextMethod,
      isActive: true,
      verificationStatus: 'unverified',
    })
    setPaymentMethods([...paymentMethods, paymentMethod])
  }, [paymentMethods])

  const setDefaultPaymentMethod = useCallback((methodId) => {
    const next = paymentMethods.map((method) => ({
      ...method,
      isDefault: method.id === methodId,
    }))

    setPaymentMethods(next)
  }, [paymentMethods])

  const removePaymentMethod = useCallback(async (methodId) => {
    const method = paymentMethods.find((item) => item.id === methodId)
    if (methodId.startsWith('pm_')) {
      await removeStripePaymentMethod(methodId)
    }
    if (method?._id) {
      await removePaymentMethodApi(method._id)
    }
    const filtered = paymentMethods.filter((method) => method.id !== methodId)

    const hasDefault = filtered.some((method) => method.isDefault)
    const next = hasDefault
      ? filtered
      : filtered.map((method, index) => ({
          ...method,
          isDefault: index === 0,
        }))

    setPaymentMethods(next)
  }, [paymentMethods])

  const value = useMemo(() => ({
    paymentMethods,
    setPaymentMethods,
    addPaymentMethod,
    setDefaultPaymentMethod,
    removePaymentMethod,
  }), [
    paymentMethods,
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
