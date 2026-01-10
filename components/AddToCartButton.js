import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { colors } from '../global'

export default function AddToCartButton({ food, restaurant, style }) {
  // Vérification des props
  if (!food) {
    console.error('AddToCartButton: food prop is missing or undefined')
    return null
  }

  if (!food.id) {
    console.error('AddToCartButton: food.id is missing or undefined', {
      foodName: food.name,
      foodKeys: Object.keys(food),
      foodData: food
    })
    return null
  }

  const dispatch = useDispatch()
  const [isPressed, setIsPressed] = useState(false)
  const scaleAnim = new Animated.Value(1)

  // Get current quantity in cart
  const cartItems = useSelector(state => state.cartReducer || [])
  const quantity = useMemo(() => {
    if (!food?.id) return 0
    return cartItems.filter(item => item.id === food.id).length
  }, [cartItems, food?.id])

  // Debug logs (only in development)
  if (__DEV__) {
    console.log('AddToCartButton Debug:', {
      foodId: food.id,
      foodName: food.name,
      cartItemsCount: cartItems.length,
      quantity,
      cartItemsSample: cartItems.slice(0, 3).map(item => ({ id: item.id, name: item.name }))
    })
  }

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
    if (!food || !restaurant) {
      console.warn('AddToCartButton: Missing food or restaurant data')
      return
    }

    // Vérification supplémentaire de l'ID
    if (!food.id) {
      console.error('AddToCartButton: Food has no ID!', food)
      return
    }

    console.log('Adding to cart:', {
      foodId: food.id,
      foodName: food.name,
      restaurantName: restaurant.name,
      currentQuantity: quantity
    })

    animatePress()
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        ...food,
        restaurantName: restaurant.name,
        restaurantImage: restaurant.image,
        restaurant: restaurant,
        uniqueKey: `${food.id}_${Date.now()}` // Ajout d'une clé unique pour éviter les conflits
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
            colors={[colors.grey[700], colors.grey[600]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientIconButton}
          >
            <Feather name="plus" size={18} color={colors.white} />
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
          colors={quantity > 0 ? [colors.grey[500], colors.grey[600]] : [colors.grey[200], colors.grey[100]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientControlButton}
        >
          <Feather name="minus" size={12} color={colors.white} />
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
          colors={[colors.grey[700], colors.grey[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientControlButton}
        >
          <Feather name="plus" size={12} color={colors.white} />
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
    shadowColor: colors.grey[700],
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
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 5,
    paddingVertical: 3,
    shadowColor: colors.grey[700],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.grey[200],
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
    color: colors.grey[800],
    letterSpacing: 0.3,
    paddingHorizontal: 2,
  },
})
