import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { grey1 } from '../global'
import { AntDesign } from '@expo/vector-icons'
import { useDispatch, useSelector } from 'react-redux'

export default function QuantityAnimate({ id, food, restaurant }) {
  const opacity = useState(new Animated.Value(0))[0]
  const marginLeft = useState(new Animated.Value(0))[0]
  const [visible, setVisible] = useState(false)
  const dispatch = useDispatch();
  let count = useSelector(state => state.cartReducer).filter((food) => food.id === id).length
  const fadeIn = () => {
    Animated.sequence([
      Animated.timing(marginLeft, {
        toValue: 50,
        duration: 100,
        useNativeDriver: false
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false
      }),
    ]).start()
  }
  if (visible) {
    fadeIn()
  }
  const styles = StyleSheet.create({
    plus: {
      backgroundColor: grey1,
      height: 30,
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 50,
    },
    plusText: {
      fontSize: 20,
      textAlign: "center",
      fontWeight: "bold"
    },
    plus1: {
    }
  })
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {!visible ? <TouchableOpacity style={styles.plus} onPress={() => {
        setVisible(true)
      }}>
        <Text style={styles.plusText}>+</Text>
      </TouchableOpacity> : <></>}
      {visible ? <Animated.View style={[{
        opacity: opacity,
      }]}>
        <TouchableOpacity onPress={() => {
          if (count)
            dispatch({
              type: 'REMOVE_FROM_CARD',
              payload: id
            });
        }}>
          <AntDesign name="minuscircle" size={25} color="black" style={styles.plus2} />
        </TouchableOpacity>
      </Animated.View> : <></>}
      {visible ? <View style={{ position: "absolute", left: 45 }}>
        <Text style={{
        }}>{count}</Text>
      </View> : <></>}
      {visible ? <Animated.View style={[{
        marginLeft: marginLeft,
      }]}>
        <TouchableOpacity onPress={() => {
          dispatch({
            type: 'ADD_TO_CART',
            payload: {
              ...food,
              restaurantName: restaurant.name,
              restaurantImage: restaurant.image,
              restaurant: restaurant
            }
          });
        }}>
          <AntDesign name="pluscircle" size={25} color="black" style={styles.plus1} />
        </TouchableOpacity>
      </Animated.View> : <></>}
    </View>
  )
}
