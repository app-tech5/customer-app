import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native';
import { APP_CONSTANT } from '../global';

export default function OrderCountDown({
  setBottomSheetHeight, setMapdirection, totalMinutes, timeLeft, setTimeLeft
}) {
  const navigation = useNavigation()
  let count = 0
  return (
    <CountdownCircleTimer
      isPlaying
      duration={totalMinutes}
      colors={['#348ac7', '#F7B801', '#A30000', '#A30000']}
      colorsTime={[23, 17, 8, 0]}
      onUpdate={(remainingTime) => {
        // if(remainingTime%4 === 0 && timeLeft >=1)
        //   setTimeLeft(timeLeft-1)
      }}
      onComplete={() => {
      }}
      size={100}
      strokeWidth={5}
    >
      {/* {() => <View style={styles.container}>
        <Text style={styles.text}>{timeLeft} </Text>
        <Text style={styles.text1}>min </Text>
      </View>} */}
       {( {remainingTime} ) => <View style={styles.container}>
        <Text style={styles.text}>{remainingTime} </Text>
        <Text style={styles.text1}>min </Text>
      </View>}
    </CountdownCircleTimer>
  )
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    height: 90,
    width: 90,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center"
  },
  text: {
    fontSize: 25,
    fontWeight: "bold",
    color: "black"
  }
})