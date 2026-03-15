import { View, Text } from 'react-native'
import React from 'react'
import i18n from '../i18n'

export default function FormElement() {
  return (
    <View>
      <Text>{i18n.t('common.formElement')}</Text>
    </View>
  )
}