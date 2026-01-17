import { View, Text, TouchableOpacity, StyleSheet} from 'react-native'
import React, { useState, useContext} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import {language, currency, colors}  from '../global'
import { generateUID } from '../global'
import Loading from './Loading'
import { api } from '../api'
import { useNavigation } from '@react-navigation/native'
import Loader from '../screens/Loader'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LoaderContext } from '../contexts/LoaderContext'
import i18n from '../i18n'
export default function Checkout({restaurantName, setLoader, setViewCartButton, setModalVisible, closeModal}) {
    const {setLoading} = useContext(LoaderContext)
    const {name, phone, address, id, lat, lng} = useSelector((state)=>state.userReducer)
     const navigation = useNavigation()
    const items = useSelector((state)=>state.cartReducer).filter(item => item.restaurantName === restaurantName)
    const total = items.reduce((prev, curr)=> prev + curr.price, 0)

    // Formater le nombre d'articles avec pluriel
    const formatItemCount = (count) => {
        const itemText = i18n.t('cart.item')
        return `${count} ${itemText}${count > 1 ? i18n.t('cart.itemsSuffix') : ''}`
    }

    console.log("IMAGE : ",items[0].restaurantImage)
    const dispatch = useDispatch();   
    const addOrderToFirebase = async () => {
        setViewCartButton(false)

        try {
            const orderData = {
                orderId: generateUID(),
                restaurantId: items[0].restaurant.restaurantId,
                restaurant: {
                    lat: items[0].restaurant.lat,
                    lng: items[0].restaurant.lng,
                    address: items[0].restaurant.address,
                    phone: items[0].restaurant.phone,
                    name: items[0].restaurant.name,
                },
                user: {
                    id: id,
                    name: name,
                    lat,
                    lng,
                    phone: phone,
                    address,
                    items: items,
                },
                status: "pending",
                createdAt: new Date().toISOString(),
            };

            await api.createOrder(orderData);

            dispatch({ type: 'CLEAR_RESTAURANT', payload: restaurantName })
            setLoading(false)
            navigation.navigate('OrderRequest',{
                lat,
                lng
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
                        setLoading(true)
                        closeModal ? closeModal() : setModalVisible(false);
                        addOrderToFirebase()
                      }}
                      activeOpacity={0.9}
                  >
                      {/* Icône de carte de crédit */}
                      <View style={styles.iconContainer}>
                          <Ionicons name="card" size={24} color="white" />
                      </View>

                      {/* Texte principal */}
                      <View style={styles.textContainer}>
                          <Text style={styles.checkoutTitle}>{i18n.t('cart.checkout')}</Text>
                          <Text style={styles.checkoutSubtitle}>
                              {formatItemCount(items.length)}
                          </Text>
                      </View>

                      {/* Prix total avec flèche */}
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
        paddingHorizontal: 20,
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
        paddingVertical: 16,
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