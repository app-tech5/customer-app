import { View, Text, StyleSheet} from 'react-native'
import React from 'react'
import LottieView from 'lottie-react-native'

export default function Loader({checkout}) {

  
  return (
    <View style={checkout?styles.checkoutStyle:styles.container}>
       <LottieView style={{
      height: 200,
      alignSelf: "center",
      width: 200,
      
    }}
      source={require("../assets/animations/food-transition2.json")}
      autoPlay
      speed={2}
      loop
    />
    </View>
  )
}

const styles = StyleSheet.create({
     
    container: {
        flex: 1,
        justifyContent: "center",
         
         
    },
    checkoutStyle: {
      backgroundColor: 'black',
      position: 'absolute',
      opacity: 0.6,
      justifyContent: "center",
      alignItems: "center",
      height: "100%",
      width: "100%"
    }
})
