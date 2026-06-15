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
  
    const calculateDeliveryFee = (deliverySetting, subtotal, distance = null) => {
      if (!deliverySetting) return 2.99
      
      if (deliverySetting.isDeliveryEnabled === false) {
        return null
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
    
        const calculatedFee =
          (Number(baseFee) || 1.5) +
          distance * (Number(perKmFee) || 0.5)
    
        return Math.min(
          Math.max(
            calculatedFee,
            Number(minFee) || 1.5
          ),
          Number(maxFee) || 10
        )
      }
      
      return parseFloat(
        deliverySetting.fixedDeliveryFee || 2.99
      )
    }

  const calculateTotal = (deliverySetting, subtotal, taxRate = null, distance = null) => {
    const deliveryFee = calculateDeliveryFee(deliverySetting, subtotal, distance)
    
    const finalDeliveryFee = subtotal > (deliverySetting?.freeDeliveryThreshold || 25)
      ? 0
      : deliveryFee

    const taxAmount = subtotal * (taxRate || 0.08)
    const total = subtotal + finalDeliveryFee + taxAmount

    return {
      subtotal,
      deliveryFee: finalDeliveryFee,
      taxAmount,
      total,
      isFreeDelivery: subtotal > (deliverySetting?.freeDeliveryThreshold || 25)
    }
  }

  const value = {
    loading,
    error,
    refreshDeliverySettings,
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
