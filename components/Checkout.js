import { View, Text, TouchableOpacity, StyleSheet} from 'react-native'
import React, { useContext } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { language, currency, colors } from '../global'
import { api } from '../api'
import { useNavigation } from '@react-navigation/native'
import { LoaderContext } from '../contexts/LoaderContext'
import i18n from '../lang/i18n'
import { useDeliverySettings } from '../contexts/DeliverySettingsContext'
export default function Checkout({ restaurantName, setLoader: _setLoader, setViewCartButton, setModalVisible, closeModal, deliverySetting, restaurant }) {
    const { setLoading } = useContext(LoaderContext)
    const { name: _name, phone: _phone, address, id, lat, lng } = useSelector((state) => state.userReducer)
     const navigation = useNavigation()
    const items = useSelector((state)=>state.cartReducer).filter(item => item.restaurantName === restaurantName)
    const { calculateTotal } = useDeliverySettings()
    
    const cartTotal = items.reduce((prev, curr)=> prev + (curr.totalPrice || curr.price), 0)
    
    const distance = restaurant?.distance > 0 ? restaurant.distance : null
    const totals = calculateTotal(deliverySetting, cartTotal, restaurant?.taxRate, distance) || {
      subtotal: cartTotal,
      deliveryFee: 2.99,
      taxAmount: cartTotal * 0.08,
      total: cartTotal + 2.99 + (cartTotal * 0.08),
      isFreeDelivery: false
    }
    const { total } = totals
    
    const formatItemCount = (count) => {
        const itemText = i18n.t('cart.item')
        return `${count} ${itemText}${count > 1 ? i18n.t('cart.itemsSuffix') : ''}`
    }

    const dispatch = useDispatch()
    const _addOrderToFirebase = async () => {
        setViewCartButton(false)

        try {
            
            const orderItems = items.map(cartItem => ({
                type: cartItem.itemType || 'Menu', 
                item: cartItem.item || cartItem.id, 
                name: cartItem.name,
                image: cartItem.image,
                price: cartItem.price,
                currency: cartItem.currency || 'EUR',
                quantity: 1, 
                total: cartItem.totalPrice || cartItem.price,
                extras: cartItem.extras || [],
                variants: cartItem.variants || []
            }));

            const orderData = {
                user: id, 
                restaurant: items[0].restaurant._id || items[0].restaurant.id, 
                items: orderItems,
                totalPrice: total,
                subtotal: totals.subtotal,
                tax: {
                    rate: restaurant?.taxRate || 0.08,
                    amount: totals.taxAmount
                },
                status: "pending",
                payment: {
                    method: "cash", 
                    status: "pending"
                },
                delivery: {
                    type: "delivery",
                    address: address,
                    deliveryFee: totals.deliveryFee
                }
            };

            await api.createOrder(orderData);

            dispatch({ type: 'CLEAR_RESTAURANT', payload: restaurantName })
            setLoading(false)
            navigation.navigate('CheckoutFlow',{
              screen: 'CheckoutScreen',
              params: {
                restaurantName,
                restaurant,
                items,
                lat,
                lng
              }
            })
        } catch (error) {
            console.error('Error creating order:', error);
            setLoading(false);
        }
    }
  return (
      <>
          <View style={styles.container}>
              <LinearGradient
                  colors={[colors.success, colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.checkoutGradient}
              >
                  <TouchableOpacity
                      style={styles.checkoutButton}
                      onPress={() => {
                        
                        closeModal ? closeModal() : setModalVisible(false);
                        
                        navigation.navigate('CheckoutFlow', {
                          screen: 'CheckoutScreen',
                          params: {
                            items,
                            restaurant,
                            restaurantName,
                            totals,
                            deliverySetting,
                            lat,
                            lng,
                          },
                        });
                        
                      }}
                      activeOpacity={0.9}
                  >
                      <View style={styles.iconContainer}>
                          <Ionicons name="card" size={24} color="white" />
                      </View>

                      <View style={styles.textContainer}>
                          <Text style={styles.checkoutTitle}>{i18n.t('cart.checkout')}</Text>
                          <Text style={styles.checkoutSubtitle}>
                              {formatItemCount(items.length)}
                          </Text>
                      </View>

                      <View style={styles.priceContainer}>
                          <Text style={styles.checkoutTotal}>
                              {total ? total.toLocaleString(language, { style: "currency", currency: currency }) : ""}
                          </Text>
                          <Ionicons name="arrow-forward" size={20} color="white" />
                      </View>
                  </TouchableOpacity>
              </LinearGradient>
          </View>
      </>
  )
}
const styles = StyleSheet.create({
    container: {
        
        paddingBottom: 20,
    },
    checkoutGradient: {
        borderRadius: 16,
        elevation: 6,
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    checkoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 16,
    },
    iconContainer: {
        marginRight: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        padding: 8,
    },
    textContainer: {
        flex: 1,
        marginRight: 12,
    },
    checkoutTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    checkoutSubtitle: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 14,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    checkoutTotal: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 6,
    },
})