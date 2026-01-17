import { View, Text, TouchableOpacity, StyleSheet} from 'react-native'
import React, { useState, useContext} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {language, currency}  from '../global'
import { generateUID } from '../global'
import Loading from './Loading'
import { api } from '../api'
import { useNavigation } from '@react-navigation/native'
import Loader from '../screens/Loader'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LoaderContext } from '../contexts/LoaderContext'
export default function Checkout({restaurantName, setLoader, setViewCartButton, setModalVisible, closeModal}) {
    const {setLoading} = useContext(LoaderContext)
    const {name, phone, address, id, lat, lng} = useSelector((state)=>state.userReducer)
     const navigation = useNavigation()
    const items = useSelector((state)=>state.cartReducer).filter(item => item.restaurantName === restaurantName)
    const total = items.reduce((prev, curr)=> prev + curr.price, 0)

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
              <TouchableOpacity
                  style={styles.checkoutButton}
                  onPress={() => {
                    setLoading(true)
                    closeModal ? closeModal() : setModalVisible(false);

                    addOrderToFirebase()


                    // navigation.navigate('OrderRequest',{   
                    //     // lat: address.location.lat,
                    //     // lng: address.location.lng,
                    //     lat,
                    //     lng
                    // })
                     
                  }}>
                  <Text style={styles.checkoutText}>Checkout</Text>
                  <Text style={styles.total}>{total ? total.toLocaleString(language, { style: "currency", currency: currency }) : ""}</Text>
              </TouchableOpacity>
          </View>
      </>
  )
}
const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "center",
    },
    checkoutButton: {
        marginTop: 20,
        backgroundColor: "black",
        alignItems: "center",
        padding: 13,
        borderRadius: 20,
        width: 300,
        position: "relative",
    },
    checkoutText: { 
        color: "white", 
        fontSize: 20
     },
    total: {
        color: "white",
        position: "absolute",
        right: 15,
        fontSize: 15,
        top: 17
    }
})