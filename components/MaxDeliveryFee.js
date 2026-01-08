import { View, Text, StyleSheet} from 'react-native'
import React from 'react'
import { Gesture, GestureDetector, PanGestureHandler } from 'react-native-gesture-handler'
import Animated, { useAnimatedGestureHandler } from 'react-native-reanimated'
import Slider from '@react-native-community/slider'

export default function MaxDeliveryFee() {
  return (
        <View style={styles.container}>
           <FeePrice />
          <Slider style={styles.slider}
          minimumValue={0}
          maximumValue={9}
           step={3}
          />
        </View>
  )
}
const FeePrice = ()=>{
  return (
    <View style={styles.feePrice}>
      <Text>$7</Text>
      <Text>$5</Text>
      <Text>$7</Text>
      <Text>$7+</Text>
    </View>
  )
}
const styles = StyleSheet.create({
    container: {
      marginHorizontal: 10,
    },
    feePrice: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginHorizontal: 10,
    },
    slider: {
      height: 20,
    }
})