import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { getGateways } from '../api'
import { SignInContext } from './authContext'
import i18n from '../lang/i18n'

const GatewayContext = createContext()

function pickStripePublishableKey(list) {
  if (!Array.isArray(list)) return null
  const stripe = list.find((g) => g?.identifier === 'stripe' && g.active)
  const pk = stripe?.credentials?.publishableKey
  return typeof pk === 'string' && pk.startsWith('pk_') ? pk : null
}

export function GatewayProvider({ children }) {
  const [gateways, setGateways] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { signedIn } = useContext(SignInContext)

  const loadGateways = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const list = await getGateways()
      const next = Array.isArray(list) ? list : []
      setGateways(next)
    } catch (err) {
      console.error(i18n.t('errors.gatewayLoad'), err)
      setError(err.message)
      setGateways([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (signedIn) {
      loadGateways()
    } else {
      setGateways([])
      setError(null)
      setLoading(false)
    }
  }, [signedIn.userToken, loadGateways])

  const refreshGateways = useCallback(() => {
    if (signedIn.userToken) loadGateways()
  }, [signedIn.userToken, loadGateways])

  const stripePublishableKey = useMemo(() => pickStripePublishableKey(gateways), [gateways])

  const value = {
    gateways,
    loading,
    error,
    refreshGateways,
    stripePublishableKey,
  }

  return <GatewayContext.Provider value={value}>{children}</GatewayContext.Provider>
}

export function useGateway() {
  const context = useContext(GatewayContext)
  if (!context) {
    throw new Error(i18n.t('errors.gatewayContext'))
  }
  return context
}

export default GatewayContext
