import React, { createContext, useContext, useState, useEffect } from 'react'
import { getDeliverySettings } from '../api'
import { SignInContext } from './authContext'
import i18n from '../lang/i18n'

const DeliverySettingsContext = createContext()

export function DeliverySettingsProvider({ children }) {
  const [deliverySettings, setDeliverySettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { signedIn } = useContext(SignInContext)

  useEffect(() => {
    if (signedIn.userToken) {
      
      loadDeliverySettings()
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

  const refreshDeliverySettings = () => {
    loadDeliverySettings()
  }
  
  const activeDeliverySettings = Array.isArray(deliverySettings)
    ? deliverySettings[0]
    : deliverySettings
  
  const calculateDeliveryFee = (subtotal, distance = null) => {
    if (!activeDeliverySettings) return 2.99

    if (activeDeliverySettings.deliveryFeeType === 'FIXED') {
      return parseFloat(activeDeliverySettings.fixedDeliveryFee || 2.99)
    }

    if (activeDeliverySettings.deliveryFeeType === 'DYNAMIC' && distance) {
      const { baseFee, perKmFee, minFee, maxFee } = activeDeliverySettings.dynamicDeliveryFee || {}
      const calculatedFee = (baseFee || 1.5) + (distance * (perKmFee || 0.5))
      return Math.min(Math.max(calculatedFee, minFee || 1.5), maxFee || 10)
    }

    if (activeDeliverySettings.deliveryFeeType === 'FREE') {
      return 0
    }

    return parseFloat(activeDeliverySettings.fixedDeliveryFee || 2.99)
  }

  const calculateTotal = (subtotal, taxRate = null, distance = null) => {
    const deliveryFee = calculateDeliveryFee(subtotal, distance)
    
    const finalDeliveryFee = subtotal > (activeDeliverySettings?.freeDeliveryThreshold || 25)
      ? 0
      : deliveryFee

    const taxAmount = subtotal * (taxRate || 0.08)
    const total = subtotal + finalDeliveryFee + taxAmount

    return {
      subtotal,
      deliveryFee: finalDeliveryFee,
      taxAmount,
      total,
      isFreeDelivery: subtotal > (activeDeliverySettings?.freeDeliveryThreshold || 25)
    }
  }

  const value = {
    deliverySettings: activeDeliverySettings, 
    deliverySettingsArray: deliverySettings, 
    loading,
    error,
    refreshDeliverySettings,
    calculateDeliveryFee,
    calculateTotal
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
