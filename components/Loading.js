import { View, Text } from 'react-native'
import React from 'react'
import LottieView from 'lottie-react-native'


export default function Loading() {
  return (
    <View style={{
        backgroundColor: 'black',
        position: 'absolute',
        opacity: 0.6,
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        width: "100%"
    }}>
        <LottieView
            style={{ height: 200 }}
            source={require('../assets/animations/waiting-pendulum.json')}
            autoPlay
            speed={3} />
    </View>
  )
}