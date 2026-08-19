import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native'
import React, { createElement, useEffect, useRef, useState } from 'react'
import LottieView from 'lottie-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '../global'
import i18n from '../lang/i18n'

const isWeb = Platform.OS === 'web'
/** Web-safe copy of food-transition2 without opaque `bg` layer (white square on web). */
const loaderAnimation = require('../assets/animations/food-transition-web.json')

function WebLottieMark({ checkout = false }) {
  const containerRef = useRef(null)
  const [failed, setFailed] = useState(false)
  const size = checkout ? 120 : 180

  useEffect(() => {
    if (!isWeb || failed || !containerRef.current) return undefined
    let anim
    let cancelled = false
    ;(async () => {
      try {
        const lottie = (await import('lottie-web')).default
        if (cancelled || !containerRef.current) return
        anim = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: loaderAnimation,
        })
        anim.setSpeed(checkout ? 2 : 1.5)
      } catch {
        if (!cancelled) setFailed(true)
      }
    })()
    return () => {
      cancelled = true
      if (anim) anim.destroy()
    }
  }, [checkout, failed])

  if (failed) {
    const webLogoAsset = require('../assets/images/logo512.png')
    const webLogoUri =
      typeof webLogoAsset === 'string' ? webLogoAsset : webLogoAsset?.default || webLogoAsset?.uri
    const logoSize = checkout ? 96 : 160
    return createElement('img', {
      src: webLogoUri,
      alt: 'Good Foods',
      width: logoSize,
      height: logoSize,
      style: {
        width: logoSize,
        height: logoSize,
        objectFit: 'contain',
        display: 'block',
        background: 'transparent',
        marginBottom: checkout ? 20 : 0,
      },
    })
  }

  return createElement('div', {
    ref: containerRef,
    style: {
      width: size,
      height: size,
      marginBottom: checkout ? 20 : 0,
      background: 'transparent',
    },
  })
}

function LoaderMark({ checkout = false }) {
  if (isWeb) {
    return <WebLottieMark checkout={checkout} />
  }

  return (
    <LottieView
      style={checkout ? styles.checkoutAnimation : styles.animation}
      source={require('../assets/animations/food-transition2.json')}
      autoPlay
      speed={checkout ? 2 : 1.5}
      loop
    />
  )
}

export default function Loader({ checkout = false, transparent = false }) {
  return (
    <View style={[styles.overlay, transparent && styles.transparentOverlay]}>
      {!checkout && (
        <LinearGradient
          colors={
            transparent
              ? ['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.15)']
              : [colors.background.primary, colors.background.secondary]
          }
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={[styles.animationContainer, isWeb && styles.animationContainerWeb]}>
              <LoaderMark />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>{i18n.t('common.preparingExperience')}</Text>
              <Text style={styles.subtitle}>
                {i18n.t('common.loadingDeliciousOptions')}
              </Text>
            </View>

            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.indicator}
            />
          </View>
        </LinearGradient>
      )}

      {checkout && (
        <View
          style={[
            styles.checkoutContent,
            transparent && styles.transparentCheckout,
          ]}
        >
          <LoaderMark checkout />
          <Text style={styles.checkoutText}>
            Processing your order...
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    backgroundColor: colors.background.primary,
  },

  transparentOverlay: {
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  gradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },

  animationContainer: {
    marginBottom: 30,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },

  animationContainerWeb: {
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    backgroundColor: 'transparent',
  },

  animation: {
    height: 180,
    width: 180,
  },

  textContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    opacity: 0.8,
  },

  indicator: {
    marginTop: 20,
    transform: [{ scale: 1.2 }],
  },

  checkoutContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    padding: 30,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },

  transparentCheckout: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  checkoutAnimation: {
    height: 120,
    width: 120,
    marginBottom: 20,
  },

  checkoutText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
})
