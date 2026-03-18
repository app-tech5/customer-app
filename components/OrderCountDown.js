import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer'
import { useNavigation } from '@react-navigation/native'
import i18n from '../lang/i18n'

export default function OrderCountDown({
  setBottomSheetHeight: _setBottomSheetHeight,
  setMapdirection: _setMapdirection,
  totalMinutes,
  timeLeft: _timeLeft,
  setTimeLeft: _setTimeLeft
}) {
  const _navigation = useNavigation()
  const _count = 0
  return (
    <CountdownCircleTimer
      isPlaying
      duration={totalMinutes}
      colors={['#348ac7', '#F7B801', '#A30000', '#A30000']}
      colorsTime={[23, 17, 8, 0]}
      onUpdate={() => {}}
      onComplete={() => {
      }}
      size={100}
      strokeWidth={5}
    >
      {}
       {( {remainingTime} ) => <View style={styles.container}>
        <Text style={styles.text}>{remainingTime} </Text>
        <Text style={styles.text1}>{i18n.t('menu.minutesAbbrev')} </Text>
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