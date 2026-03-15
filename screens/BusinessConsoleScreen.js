import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import i18n from '../i18n'

export default function BusinessConsoleScreen() {
  return (
    <View style={styles.container}>
      <Text>{i18n.t('drawer.business')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }
})