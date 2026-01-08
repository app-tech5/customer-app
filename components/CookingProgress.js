import { View, Text, StyleSheet} from 'react-native'
import React from 'react'

export default function CookingProgress() {
  return (
    <View style={styles.container}>
       <View style={styles.step}></View>
       <View style={styles.step}></View>
       <View style={styles.step}></View>
       <View style={styles.step}></View>
       <View style={styles.step}></View>
        
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "center",
     marginHorizontal: 20,
     marginTop: 20
    },
    step: {
      height: 3,
      backgroundColor: "#e6e6ff",
      width: 60,
      marginLeft: 5
    },
     
})