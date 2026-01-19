import { View, Text, StyleSheet} from 'react-native'
import React from 'react'
import LottieView from 'lottie-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '../global'
import { ActivityIndicator } from 'react-native'

export default function Loader({checkout}) {


  return (
    <View style={checkout ? styles.checkoutStyle : styles.container}>
      {!checkout && (
        <LinearGradient
          colors={[colors.background.primary, colors.background.secondary]}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.animationContainer}>
              <LottieView
                style={styles.animation}
                source={require("../assets/animations/food-transition2.json")}
                autoPlay
                speed={1.5}
                loop
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>Preparing your experience</Text>
              <Text style={styles.subtitle}>Loading delicious options...</Text>
            </View>

            <View style={styles.indicatorContainer}>
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.indicator}
              />
            </View>
          </View>
        </LinearGradient>
      )}

      {checkout && (
        <View style={styles.checkoutContent}>
          <LottieView
            style={styles.checkoutAnimation}
            source={require("../assets/animations/food-transition2.json")}
            autoPlay
            speed={2}
            loop
          />
          <Text style={styles.checkoutText}>Processing your order...</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
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
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
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
    indicatorContainer: {
        marginTop: 20,
    },
    indicator: {
        transform: [{ scale: 1.2 }],
    },
    checkoutStyle: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkoutContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
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
