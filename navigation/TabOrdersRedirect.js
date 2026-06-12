import React, { useEffect } from 'react'
import { View } from 'react-native'
import { navigateToTabOrders } from './navigationHelpers'

export default function TabOrdersRedirect({ navigation }) {
  useEffect(() => {
    navigateToTabOrders(navigation, 'Orders')
  }, [navigation])

  return <View />
}
