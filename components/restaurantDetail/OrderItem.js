import { View, Text, StyleSheet, Platform} from 'react-native'
import React from 'react'
import {language, currency} from '../../global'
import { MaterialIcons} from '@expo/vector-icons';

  export default function OrderItem({name, quantity, items}) {
   
  return (
    <View style={styles.container}>
      <View style={styles.title_icon_quantity}>
          <Text style={styles.title}>{name}</Text>
          <MaterialIcons name="close" size={12} color="black" />
          <Text style={styles.quantity}>{quantity}</Text>
      </View>
      <Text style={styles.price}>{Number(items.reduce((a, v) => v.name === name ? a + v.price : a, 0)).toLocaleString(language, {style: "currency", currency: currency})}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
   
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#999",
     
},
title_icon_quantity: {
   
   flexDirection: "row",
   alignItems: "center"
},
  title: {
    
    fontWeight:Platform.OS === "android"?"bold":"600",
    fontSize: 16,
    paddingRight: 5
    
},
price: {
  
  opacity: 0.7,
  fontSize: 16,
  
},
quantity: {
 
}

})