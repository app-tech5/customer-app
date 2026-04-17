import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons, FontAwesome } from '@expo/vector-icons'
import i18n from '../lang/i18n'
import { colors } from '../global'

export default function PaymentMethodItem({
  method,
  variant = 'checkout',
  isSelected = false,
  onPress,
  onMenuPress,
  showMenu = false,
  showDefaultBadge = false,
}) {
  const methodType = method?.methodType
  const IconComponent = methodType?.includes('paypal') ? FontAwesome : Ionicons
  const Container = onPress ? TouchableOpacity : View

  const iconName = methodType?.includes('card') ? 'card' : methodType?.includes('paypal') ? 'paypal' : methodType?.includes('cash') ? 'cash' : methodType?.includes('google_pay') ? 'card-outline' : methodType?.includes('apple_pay') ? 'apple_pay' : 'card'
  const firstLetter = method?.cardDetails?.cardBrand?.charAt(0).toUpperCase()
  
  const title = methodType?.includes('cash') ? 'Cash' : methodType?.includes('paypal') ? 'Paypal' : methodType?.includes('google_pay') ? 'Google Pay' : methodType?.includes('apple_pay') ? 'Apple Pay' : firstLetter + method?.cardDetails?.cardBrand?.slice(1) || method?.cardDetails?.label
  const isCheckout = variant === 'checkout'

  return (
    <Container
      style={[styles.item, isSelected && styles.selectedItem]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : undefined}
    >
      <View style={styles.left}>
        <View style={[styles.iconWrap, isCheckout && isSelected && styles.selectedIconWrap]}>
          <IconComponent
            name={iconName}
            size={20}
            color={isCheckout && isSelected ? colors.text.white : colors.primary}
          />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, isCheckout && isSelected && styles.selectedName]}>
            {title}
          </Text>
          {method?.cardDetails?.cardNumberLast4 ? (
            <Text style={[styles.details, isCheckout && isSelected && styles.selectedDetails]}>
              •••• {method.cardDetails.cardNumberLast4}
            </Text>
          ) : null}
          {showDefaultBadge && method?.isDefault ? (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>
                {i18n.t('wallet.default', 'Default')}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {showMenu ? (
        <TouchableOpacity style={styles.actions} onPress={onMenuPress}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      ) : null}

      {!showMenu && isSelected ? (
        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
      ) : null}
    </Container>
  )
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedItem: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedIconWrap: {
    backgroundColor: colors.primary,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  selectedName: {
    color: colors.primary,
  },
  details: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  selectedDetails: {
    color: colors.primary,
  },
  defaultBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.white,
    textTransform: 'uppercase',
  },
  actions: {
    padding: 8,
  },
})
