import React, { useCallback } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { navigateToTabOrders } from './navigationHelpers'
import { colors } from '../global'

export default function TabOrdersRedirect({ navigation }) {
  useFocusEffect(
    useCallback(() => {
      navigateToTabOrders(navigation, 'Orders')
    }, [navigation])
  )

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  )
}
