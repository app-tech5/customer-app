import { View, Text, Platform } from 'react-native'
import React from 'react'

export default function RestaurantName(props) {
  return (
    <Text style={{
        fontSize: 29,
        fontWeight:Platform.OS === "android"?"bold":"600",
        marginTop: 10,
        flex: 1, // Prendre l'espace disponible
        flexWrap: 'wrap', // Permettre le wrapping
        numberOfLines: 2, // Maximum 2 lignes
        ellipsizeMode: 'tail', // Ajouter "..." à la fin si tronqué
    }}
    >{props.name}</Text>
  )
}