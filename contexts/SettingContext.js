import React, { createContext, useContext, useState, useEffect } from 'react'
import { getSettings, getAppConfig } from '../api'
import { SignInContext } from './authContext'
import i18n from '../lang/i18n'

const SettingContext = createContext()

export function SettingProvider({ children }) {
  const [settings, setSettings] = useState(null)
  const [appConfig, setAppConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { signedIn } = useContext(SignInContext)

  useEffect(() => {
    if (signedIn) {
      
      loadSettings()
    }
  }, [signedIn])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const [settingsData, appConfigData] = await Promise.all([
        getSettings(),
        getAppConfig().catch(() => null),
      ])

      const appSettings = Array.isArray(settingsData) ? settingsData[0] : settingsData

      setSettings(appSettings)
      setAppConfig(appConfigData)
      setError(null)
    } catch (err) {
      console.error(i18n.t('errors.settingsLoad'), err)
      setError(err.message)
      
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
  
  const defaultCurrency = settings?.currency || { symbol: '€', code: 'EUR' }
  const defaultLanguage = settings?.language || { code: 'fr', name: 'Français' }

  const value = {
    settings,
    loading,
    error,
    refreshSettings,
    currency: defaultCurrency,
    language: defaultLanguage,
    appName: settings?.appName || appConfig?.appName || 'Good Food',
    appConfig,
    supportEmail: appConfig?.supportEmail || null,
  }

  return (
    <SettingContext.Provider value={value}>
      {children}
    </SettingContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingContext)
  if (!context) {
    throw new Error(i18n.t('errors.settingsContext'))
  }
  return context
}

export default SettingContext

