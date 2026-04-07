import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSelector } from 'react-redux'

const PaymentMethodsContext = createContext()

export function PaymentMethodsProvider({ children }) {
  const user = useSelector((state) => state.userReducer)
  const currentUserId = user?.userId
  const [paymentMethods, setPaymentMethods] = useState([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const [hydrated, setHydrated] = useState(false)
  const storageKey = useMemo(
    () => (currentUserId ? `payment_methods:${currentUserId}` : null),
    [currentUserId]
  )

  useEffect(() => {
    let isMounted = true

    const hydratePaymentMethods = async () => {
      if (!storageKey) {
        if (isMounted) {
          setPaymentMethods([])
          setSelectedPaymentMethod(null)
          setHydrated(true)
        }
        return
      }

      setHydrated(false)

      try {
        const raw = await AsyncStorage.getItem(storageKey)
        const storedValue = raw ? JSON.parse(raw) : null
        const storedPaymentMethods = Array.isArray(storedValue?.paymentMethods)
          ? storedValue.paymentMethods
          : []
        const storedSelectedPaymentMethod = storedValue?.selectedPaymentMethod || null
        const fallbackSelectedPaymentMethod =
          storedPaymentMethods.find((method) => method.isDefault) || null

        if (isMounted) {
          setPaymentMethods(storedPaymentMethods)
          setSelectedPaymentMethod(storedSelectedPaymentMethod || fallbackSelectedPaymentMethod)
        }
      } catch (error) {
        console.warn('Failed to load payment methods from storage', error)
        if (isMounted) {
          setPaymentMethods([])
          setSelectedPaymentMethod(null)
        }
      } finally {
        if (isMounted) {
          setHydrated(true)
        }
      }
    }

    void hydratePaymentMethods()

    return () => {
      isMounted = false
    }
  }, [storageKey])

  useEffect(() => {
    if (!storageKey || !hydrated) {
      return
    }

    void AsyncStorage.setItem(
      storageKey,
      JSON.stringify({
        paymentMethods,
        selectedPaymentMethod,
      })
    )
  }, [hydrated, paymentMethods, selectedPaymentMethod, storageKey])

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
