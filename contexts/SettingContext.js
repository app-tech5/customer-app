import React, { createContext, useContext, useState, useEffect } from 'react'
import { getSettings } from '../api'

// Créer le contexte
const SettingContext = createContext()

// Provider du contexte
export function SettingProvider({ children }) {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Charger les settings au montage du provider
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const settingsData = await getSettings()

      // Si c'est un tableau, prendre le premier élément (settings principaux)
      const appSettings = Array.isArray(settingsData) ? settingsData[0] : settingsData

      setSettings(appSettings)
      setError(null)
    } catch (err) {
      console.error('Erreur chargement settings:', err)
      setError(err.message)

      // Valeurs par défaut en cas d'erreur
      setSettings({
        appName: 'Good Food',
        currency: {
          value: 'EUR',
          label: 'Euro',
          symbol: '€',
          code: 'EUR'
        },
        language: {
          code: 'fr',
          isDefault: true,
          name: 'Français'
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshSettings = () => {
    loadSettings()
  }

  // Valeurs par défaut si pas encore chargé
  const defaultCurrency = settings?.currency || { symbol: '€', code: 'EUR' }
  const defaultLanguage = settings?.language || { code: 'fr', name: 'Français' }

  const value = {
    settings,
    loading,
    error,
    refreshSettings,
    currency: defaultCurrency,
    language: defaultLanguage,
    appName: settings?.appName || 'Good Food'
  }

  return (
    <SettingContext.Provider value={value}>
      {children}
    </SettingContext.Provider>
  )
}

// Hook pour utiliser le contexte
export function useSettings() {
  const context = useContext(SettingContext)
  if (!context) {
    throw new Error('useSettings doit être utilisé dans un SettingProvider')
  }
  return context
}

export default SettingContext
