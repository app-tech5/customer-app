import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';

export default function OrderCompleted() {

  const [lastOrder, setLastOrder] = useState({ items: [] })

  useEffect(() => {
  }, [])
  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: "white",

    }}>
      <LottieView style={{
        height: 100,
        alignSelf: "center",
        marginBottom: 30,
      }}
        source={require("../assets/animations/check-mark.json")}
        autoPlay
        speed={0.5}
        loop={false}
      />
      <LottieView style={{
        height: 206,
        alignSelf: "center",
      }}
        source={require("../assets/animations/cooking.json")}
        autoPlay
        speed={0.5}
      />
    </SafeAreaView>
  )
}