import React, { createContext, useContext, useState, useEffect } from 'react'
import { getDeliverySettings, getSubscriptionBenefits } from '../api'
import { SignInContext } from './authContext'
import i18n from '../lang/i18n'

const DeliverySettingsContext = createContext()

export function DeliverySettingsProvider({ children }) {
  const [deliverySettings, setDeliverySettings] = useState(null)
  const [subscriptionBenefits, setSubscriptionBenefits] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { signedIn } = useContext(SignInContext)

  useEffect(() => {
    if (signedIn.userToken) {
      loadDeliverySettings()
      loadSubscriptionBenefits()
    } else {
      setSubscriptionBenefits(null)
    }
  }, [signedIn.userToken])

  const loadDeliverySettings = async () => {
    try {
      setLoading(true)
      const settings = await getDeliverySettings()
      setDeliverySettings(settings)
      setError(null)
    } catch (err) {
      console.error(i18n.t('errors.deliverySettingsLoad'), err)
      setError(err.message)
      
      setDeliverySettings({
        fixedDeliveryFee: 2.99,
        freeDeliveryThreshold: 25,
        deliveryFeeType: 'FIXED'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSubscriptionBenefits = async () => {
    try {
      const benefits = await getSubscriptionBenefits()
      setSubscriptionBenefits(benefits)
    } catch {
      setSubscriptionBenefits(null)
    }
  }

  const refreshDeliverySettings = () => {
    loadDeliverySettings()
  }

  const refreshSubscriptionBenefits = () => {
    loadSubscriptionBenefits()
  }
  
  const hasMemberFreeDelivery =
    !!subscriptionBenefits?.active && !!subscriptionBenefits?.freeDelivery

  const calculateDeliveryFee = (
    deliverySetting,
    subtotal,
    distance = null,
    options = {}
  ) => {
    if (!deliverySetting) return 2.99

    if (deliverySetting.isDeliveryEnabled === false) {
      return null
    }

    if (hasMemberFreeDelivery) {
      return 0
    }
    
    if (
      deliverySetting.deliveryFeeType === 'FREE' ||
      deliverySetting.freeDeliveryEnabled
    ) {
      return 0
    }
    
    if (
      subtotal >=
      (deliverySetting.freeDeliveryThreshold || 25)
    ) {
      return 0
    }

    const surgeMultiplier = Number(options.surgeMultiplier)
    const applySurge =
      Number.isFinite(surgeMultiplier) && surgeMultiplier > 1
        ? surgeMultiplier
        : 1
    
    if (
      ['DYNAMIC', 'RESTAURANT_DEFINED'].includes(
        deliverySetting.deliveryFeeType
      ) &&
      distance != null
    ) {
      const {
        baseFee,
        perKmFee,
        minFee,
        maxFee
      } = deliverySetting.dynamicDeliveryFee || {}
  
      let calculatedFee =
        (Number(baseFee) || 1.5) +
        distance * (Number(perKmFee) || 0.5)
  
      calculatedFee = Math.min(
        Math.max(
          calculatedFee,
          Number(minFee) || 1.5
        ),
        Number(maxFee) || 10
      )

      if (applySurge > 1) calculatedFee *= applySurge
      return Number(calculatedFee.toFixed(2))
    }
    
    let fixed = parseFloat(deliverySetting.fixedDeliveryFee || 2.99)
    if (applySurge > 1 && fixed > 0) fixed *= applySurge
    return Number(fixed.toFixed(2))
  }

  const calculateTotal = (
    deliverySetting,
    subtotal,
    taxRate = null,
    distance = null,
    options = {}
  ) => {
    const deliveryFee = calculateDeliveryFee(
      deliverySetting,
      subtotal,
      distance,
      options
    )
    const finalDeliveryFee = deliveryFee == null ? 0 : deliveryFee

    const taxAmount = subtotal * (taxRate || 0.08)
    const total = subtotal + finalDeliveryFee + taxAmount

    return {
      subtotal,
      deliveryFee: finalDeliveryFee,
      taxAmount,
      total,
      isFreeDelivery: finalDeliveryFee === 0,
      memberFreeDelivery: hasMemberFreeDelivery,
      surgeMultiplier: options.surgeMultiplier || 1,
    }
  }

  const value = {
    loading,
    error,
    refreshDeliverySettings,
    refreshSubscriptionBenefits,
    subscriptionBenefits,
    calculateDeliveryFee,
    calculateTotal,
  }

  return (
    <DeliverySettingsContext.Provider value={value}>
      {children}
    </DeliverySettingsContext.Provider>
  )
}

export function useDeliverySettings() {
  const context = useContext(DeliverySettingsContext)
  if (!context) {
    throw new Error(i18n.t('errors.deliverySettingsContext'))
  }
  return context
}

export default DeliverySettingsContext
