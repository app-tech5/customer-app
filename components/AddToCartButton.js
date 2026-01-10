import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'

export default function AddToCartButton({ food, restaurant, style }) {
  const dispatch = useDispatch()
  const [isPressed, setIsPressed] = useState(false)
  const scaleAnim = new Animated.Value(1)

  // Get current quantity in cart
  const cartItems = useSelector(state => state.cartReducer || [])
  const quantity = cartItems.filter(item => item.id === food.id).length

  // Animation effect when pressed
  const animatePress = () => {
    setIsPressed(true)
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => setIsPressed(false))
  }

  const handleAddToCart = () => {
    if (!food || !restaurant) return

    animatePress()
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        ...food,
        restaurantName: restaurant.name,
        restaurantImage: restaurant.image,
        restaurant: restaurant
      }
    })
  }

  const handleRemoveFromCart = () => {
    if (quantity === 0) return

    dispatch({
      type: 'REMOVE_FROM_CARD',
      payload: food.id
    })
  }

  const handleIncrease = () => {
    handleAddToCart()
  }

  const handleDecrease = () => {
    handleRemoveFromCart()
  }

  if (quantity === 0) {
    // Simple "Add" button with gradient
    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddToCart}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#43484d', '#5e6977']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientIconButton}
          >
            <Feather name="plus" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  // Quantity controls (like Uber Eats)
  return (
    <View style={[styles.quantityContainer, style]}>
      <TouchableOpacity
        style={[styles.controlButton]}
        onPress={handleDecrease}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={quantity > 0 ? ['#86939e', '#5e6977'] : ['#bdc6cf', '#e1e8ee']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientControlButton}
        >
          <Feather name="minus" size={12} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.quantityDisplay}>
        <Text style={styles.quantityText}>{quantity}</Text>
      </View>

      <TouchableOpacity
        style={[styles.controlButton]}
        onPress={handleIncrease}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#43484d', '#5e6977']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientControlButton}
        >
          <Feather name="plus" size={12} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    shadowColor: '#43484d',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  gradientIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 14,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 5,
    paddingVertical: 3,
    shadowColor: '#43484d',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#bdc6cf',
  },
  controlButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  gradientControlButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityDisplay: {
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    backgroundColor: 'rgba(248, 249, 250, 0.9)',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(67, 72, 77, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d3436',
    letterSpacing: 0.3,
    paddingHorizontal: 2,
  },
})
