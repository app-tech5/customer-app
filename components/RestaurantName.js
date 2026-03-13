import { Text, Platform } from 'react-native'
import React from 'react'

export default function RestaurantName(props) {
  return (
    <Text style={{
        fontSize: 29,
        fontWeight:Platform.OS === "android"?"bold":"600",
        marginTop: 10,
        flex: 1, 
        flexWrap: 'wrap', 
        numberOfLines: 2, 
        ellipsizeMode: 'tail', 
    }}
    >{props.name}</Text>
  )
}