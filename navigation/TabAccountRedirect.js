import React, { useEffect } from 'react'
import { View } from 'react-native'
import { navigateToTabAccount } from './navigationHelpers'

export default function TabAccountRedirect({ navigation }) {
  useEffect(() => {
    navigateToTabAccount(navigation, 'AccountScreen')
  }, [navigation])

  return <View />
}
