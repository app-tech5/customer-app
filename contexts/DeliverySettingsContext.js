import React, { createContext, useContext, useState, useEffect } from 'react'
import { getDeliverySettings } from '../api'

// Créer le contexte
const DeliverySettingsContext = createContext()

// Provider du contexte
export function DeliverySettingsProvider({ children }) {
  const [deliverySettings, setDeliverySettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Charger les delivery settings au montage du provider
    loadDeliverySettings()
  }, [])

  const loadDeliverySettings = async () => {
    try {
      setLoading(true)
      const settings = await getDeliverySettings()
      setDeliverySettings(settings)
      setError(null)
    } catch (err) {
      console.error('Erreur chargement delivery settings:', err)
      setError(err.message)

      // Valeurs par défaut en cas d'erreur
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

  // Obtenir les settings actifs (premier élément du tableau)
  const activeDeliverySettings = Array.isArray(deliverySettings)
    ? deliverySettings[0]
    : deliverySettings

  // Fonctions utilitaires pour les calculs de livraison
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

    // Appliquer la livraison gratuite si seuil dépassé
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
    deliverySettings: activeDeliverySettings, // Retourner l'objet actif, pas le tableau brut
    deliverySettingsArray: deliverySettings, // Garder le tableau brut si nécessaire
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

// Hook pour utiliser le contexte
export function useDeliverySettings() {
  const context = useContext(DeliverySettingsContext)
  if (!context) {
    throw new Error('useDeliverySettings doit être utilisé dans un DeliverySettingsProvider')
  }
  return context
}

export default DeliverySettingsContext
