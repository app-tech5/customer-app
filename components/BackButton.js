import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const BackButton = ({
  onPress,
  style = {},
  backgroundColor = 'rgba(0, 0, 0, 0.5)',
  iconColor = 'white',
  size = 24,
  iconName = 'arrow-back'
}) => {
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Ionicons name={iconName} size={size} color={iconColor} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
})

export default BackButton
