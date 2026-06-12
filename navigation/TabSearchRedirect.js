import React, { useEffect } from 'react'
import { View } from 'react-native'
import { navigateToTabSearch } from './navigationHelpers'

export default function TabSearchRedirect({ navigation }) {
  useEffect(() => {
    navigateToTabSearch(navigation, 'SearchScreen')
  }, [navigation])

  return <View />
}
