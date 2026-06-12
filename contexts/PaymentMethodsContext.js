import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Alert } from 'react-native'
import { useSelector } from 'react-redux'
import { config } from '../config'
import i18n from '../lang/i18n'
import {
  removeStripePaymentMethod,
  getUserPaymentMethods,
  addPaymentMethod as addPaymentMethodApi,
  removePaymentMethod as removePaymentMethodApi,
  setDefaultPaymentMethod as setDefaultPaymentMethodApi,
} from '../api'

const PaymentMethodsContext = createContext()

const getPaymentMethodKey = (method) => method?._id || method?.id

export const normalizePaymentMethods = (methods) => {
  if (!Array.isArray(methods) || methods.length === 0) return []

  const list = methods.map((method) => ({
    ...method,
    id: method.id || method._id,
  }))

  if (list.some((method) => method.isDefault)) {
    return list
  }

  return list.map((method, index) => ({
    ...method,
    isDefault: index === 0,
  }))
}

export function PaymentMethodsProvider({ children }) {
  const user = useSelector((state) => state.userReducer)
  const [paymentMethods, setPaymentMethods] = useState([])

  const refreshPaymentMethods = useCallback(async () => {
    try {
      const methods = await getUserPaymentMethods()
      setPaymentMethods(normalizePaymentMethods(methods))
    } catch (error) {
      console.warn('Failed to load payment methods from API', error)
    }
  }, [])

  useEffect(() => {
    refreshPaymentMethods()
  }, [refreshPaymentMethods])

  const showDemoBlockAlert = () => {
    Alert.alert(i18n.t('common.info'), i18n.t('wallet.paymentMethodDisabledInDemo'))
  }

  const addPaymentMethod = useCallback(async (method) => {
    if (config.DEMO_MODE) {
      showDemoBlockAlert()
      return
    }

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
    setPaymentMethods(normalizePaymentMethods([...paymentMethods, paymentMethod]))
  }, [paymentMethods])

  const setDefaultPaymentMethod = useCallback(async (methodId) => {
    if (config.DEMO_MODE) {
      Alert.alert(i18n.t('common.info'), i18n.t('wallet.setDefaultDisabledInDemo'))
      return
    }

    const method = paymentMethods.find(
      (item) => getPaymentMethodKey(item) === methodId || item.id === methodId
    )
    const apiId = getPaymentMethodKey(method)
    if (!apiId) return

    try {
      await setDefaultPaymentMethodApi(apiId)
      await refreshPaymentMethods()
    } catch (error) {
      console.warn('Failed to set default payment method', error)
      Alert.alert(i18n.t('common.error'), i18n.t('wallet.setDefaultError'))
    }
  }, [paymentMethods, refreshPaymentMethods])

  const removePaymentMethod = useCallback(async (methodId) => {
    if (config.DEMO_MODE) {
      showDemoBlockAlert()
      return
    }

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

    setPaymentMethods(normalizePaymentMethods(next))
  }, [paymentMethods])

  const value = useMemo(() => ({
    paymentMethods,
    setPaymentMethods,
    addPaymentMethod,
    setDefaultPaymentMethod,
    removePaymentMethod,
    refreshPaymentMethods,
  }), [
    paymentMethods,
    addPaymentMethod,
    setDefaultPaymentMethod,
    removePaymentMethod,
    refreshPaymentMethods,
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
