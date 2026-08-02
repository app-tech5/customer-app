import React, { useState, useMemo, useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { colors } from '../global'
import { addToCart as addToCartAPI } from '../api'
import i18n from '../lang/i18n'

export default function AddToCartButton({ food, restaurant, style }) {
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
  const [, setIsPressed] = useState(false)
  const scaleAnim = useRef(new Animated.Value(1)).current
  const quantityScaleAnim = useRef(new Animated.Value(0)).current

  const cartItems = useSelector(state => state.cartReducer || [])
  const quantity = useMemo(() => {
    if (!food?.id) return 0
    return cartItems.filter(item => item.id === food.id).length
  }, [cartItems, food?.id])

  useEffect(() => {
    if (quantity > 0) {
      quantityScaleAnim.setValue(0)
      Animated.spring(quantityScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start()
    }
  }, [quantity])

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

  const handleAddToCart = async () => {
    if (!food || !restaurant) {
      console.warn('AddToCartButton: Missing food or restaurant data')
      return
    }
    
    if (!food.id) {
      console.error('AddToCartButton: Food has no ID!', food)
      return
    }

    animatePress()
    const itemId = food.id || `item_${Date.now()}_${Math.random()}`;
    const uniqueKey = `${itemId}_${Date.now()}_${Math.random()}`;

    const cartItem = {
      ...food,
      id: itemId,
      restaurantName: restaurant.name,
      restaurantImage: restaurant.image,
      restaurant: restaurant,
      uniqueKey: uniqueKey 
    }
    
    dispatch({
      type: 'ADD_TO_CART',
      payload: cartItem
    })
    
    try {
      await addToCartAPI(cartItem)
    } catch (error) {
      console.error('Error syncing add to cart:', error)
    }
  }

  const handleRemoveFromCart = async () => {
    if (quantity === 0) return

    const cartItem = cartItems.find(item => item.id === food.id)
    if (!cartItem) return

    dispatch({
      type: 'REMOVE_FROM_CARD',
      payload: food.id
    })

    try {
      const { removeFromCart } = await import('../api')
      await removeFromCart(food.id)
    } catch (error) {
      console.error('Error syncing remove from cart:', error)
    }
  }

  const handleIncrease = () => {
    handleAddToCart()
  }

  const handleDecrease = () => {
    handleRemoveFromCart()
  }

  if (quantity === 0) {
    
    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddToCart}
          activeOpacity={0.8}
          accessibilityLabel={i18n.t('common.addToCartA11y')}
          accessibilityRole="button"
          testID="add-to-cart-button"
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
  
  return (
    <Animated.View
      style={[
        styles.quantityContainer,
        style,
        { transform: [{ scale: quantityScaleAnim }] },
      ]}
    >
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
    </Animated.View>
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
