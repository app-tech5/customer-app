import React, { useCallback } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { navigateToTabAccount } from './navigationHelpers'
import { colors } from '../global'

export default function TabAccountRedirect({ navigation }) {
  useFocusEffect(
    useCallback(() => {
      navigateToTabAccount(navigation, 'AccountScreen')
    }, [navigation])
  )

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  )
}
