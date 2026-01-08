import { View, Text, StyleSheet, Platform} from 'react-native'
import React from 'react'

export default function RestaurantDescription(props) {
  return (
    <View style={styles.description}>
    <Text style={props.style?{...props.style}:styles.textDescription}>{props.description}</Text>
  </View>
  )
}

const styles = StyleSheet.create({
    textDescription: {

        fontWeight:Platform.OS === "android"?"bold":"400",
        fontSize: 15.5,
    
      }, 
})