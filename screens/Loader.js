import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native'
import React from 'react'
import LottieView from 'lottie-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '../global'
import i18n from '../lang/i18n'

const isWeb = Platform.OS === 'web'
const webLogoAsset = require('../assets/images/goodFood.png')
const webLogoUri =
  typeof webLogoAsset === 'string' ? webLogoAsset : webLogoAsset?.default || webLogoAsset?.uri

function LoaderMark({ checkout = false }) {
  if (isWeb) {
    const size = checkout ? 96 : 160
    return (
      <img
        src={webLogoUri}
        alt="Good Foods"
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          display: 'block',
          marginBottom: checkout ? 20 : 0,
        }}
      />
    )
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
  const webGradient = ['#b3b3b3', '#9e9e9e']

  return (
    <View style={[styles.overlay, transparent && styles.transparentOverlay, isWeb && !transparent && styles.overlayWeb]}>
      {!checkout && (
        <LinearGradient
          colors={
            transparent
              ? ['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.15)']
              : isWeb
                ? webGradient
                : [colors.background.primary, colors.background.secondary]
          }
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={[styles.animationContainer, isWeb && styles.animationContainerWeb]}>
              <LoaderMark />
            </View>

            <View style={styles.textContainer}>
              <Text style={[styles.title, isWeb && styles.titleWeb]}>{i18n.t('common.preparingExperience')}</Text>
              <Text style={[styles.subtitle, isWeb && styles.subtitleWeb]}>
                {i18n.t('common.loadingDeliciousOptions')}
              </Text>
            </View>

            <ActivityIndicator
              size="small"
              color={isWeb ? '#111111' : colors.primary}
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

  overlayWeb: {
    backgroundColor: '#b3b3b3',
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

  titleWeb: {
    color: '#111111',
  },

  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    opacity: 0.8,
  },

  subtitleWeb: {
    color: '#3d5c5c',
    opacity: 1,
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
