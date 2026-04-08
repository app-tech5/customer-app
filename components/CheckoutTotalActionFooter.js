import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../global'

const VARIANTS = {
  primary: colors.primary,
  success: colors.success,
}

/**
 * Barre fixe en bas : montant + libellé à gauche, bouton d’action à droite.
 * Gère le padding safe-area inférieur pour éviter le chevauchement avec la barre système.
 */
export default function CheckoutTotalActionFooter({
  totalAmount,
  totalCaption,
  actionLabel,
  onActionPress,
  disabled = false,
  actionIcon = 'arrow-forward',
  variant = 'primary',
}) {
  const insets = useSafeAreaInsets()
  const buttonColor = VARIANTS[variant] ?? VARIANTS.primary

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.totalBlock}>
        <Text style={styles.totalAmount}>{totalAmount}</Text>
        <Text style={styles.totalCaption}>{totalCaption}</Text>
      </View>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: buttonColor }, disabled && styles.actionDisabled]}
        onPress={onActionPress}
        disabled={disabled}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        <Text style={styles.actionLabel}>{actionLabel}</Text>
        <Ionicons name={actionIcon} size={20} color={colors.text.white} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  totalBlock: {
    flex: 1,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  totalCaption: {
    fontSize: 12,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionDisabled: {
    opacity: 0.6,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.white,
    marginRight: 8,
  },
})
