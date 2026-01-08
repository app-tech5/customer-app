import { View, Text, StyleSheet} from 'react-native'
import React from 'react'
import FormElement from './FormElement'

export default function AddCard() {
  return (
    <View style={styles.container}>
       <FormElement name="credit-card"/>
    </View>
  )
}

const styles = StyleSheet.create({
  
    container: {
        marginHorizontal: 10,
    }
})