import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { Icon } from 'react-native-elements'
import { colors, currency } from '../../global'

export default function PromotionCard({ promotion }) {
  // Fonction pour formater les prix selon la monnaie
  const formatPrice = (amount) => {
    if (!amount) return '';
    const numAmount = parseFloat(amount);
    if (currency === 'EUR') {
      return `€${numAmount.toFixed(2)}`;
    } else if (currency === 'USD') {
      return `$${numAmount.toFixed(2)}`;
    } else {
      return `${numAmount.toFixed(2)} ${currency}`;
    }
  };

  // Utiliser UNIQUEMENT les données de la base de données
  // Le titre et description viennent directement du champ 'name' et 'description'
  const getPromotionDisplay = () => {
    const baseConfig = {
      title: promotion.name, // VIENT DE LA DB
      subtitle: promotion.description, // VIENT DE LA DB
      color: colors.accent
    }
    console.log("promotion.promotionType", promotion.promotionType);
    // Icônes raffinées selon la charte Material Design
    switch (promotion.promotionType) {
      case 'percentage_discount':
        return { ...baseConfig, icon: 'percent-outline', color: colors.accent }
      case 'fixed_discount':
        return { ...baseConfig, icon: 'cash-multiple', color: colors.success }
      case 'free_delivery':
        return { ...baseConfig, icon: 'truck-delivery-outline', color: colors.primary }
      case 'buy_x_get_y':
        return { ...baseConfig, icon: 'gift-outline', color: '#FF69B4' }
      case 'combo_deal':
        return { ...baseConfig, icon: 'food-variant-outline', color: colors.warning }
      case 'flash_sale':
        return { ...baseConfig, icon: 'lightning-bolt-outline', color: colors.error }
      case 'happy_hour':
        return { ...baseConfig, icon: 'clock-time-eight-outline', color: colors.info }
      default:
        return { ...baseConfig, icon: 'tag-outline', color: colors.accent }
    }
  }

  const display = getPromotionDisplay()

  // Formater la date de fin
  const formatEndDate = (endDate) => {
    if (!endDate) return ''
    const date = new Date(endDate)
    const now = new Date()
    const diffTime = date - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return 'Expired'
    if (diffDays === 1) return 'Expires today'
    if (diffDays <= 7) return `Expires in ${diffDays} days`
    return `Until ${date.toLocaleDateString()}`
  }

  return (
    <TouchableOpacity style={[styles.container, { borderLeftColor: display.color }]} activeOpacity={0.8}>
      <View style={styles.iconContainer}>
        <Icon
          name={display.icon}
          type="material-community"
          color={display.color}
          size={24}
        />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: display.color }]}>{display.title}</Text>
        <Text style={styles.subtitle}>{display.subtitle}</Text>

        {/* Conditions supplémentaires si elles existent */}
        {promotion.minOrderAmount && (
          <Text style={styles.condition}>
            Min. order: {formatPrice(promotion.minOrderAmount)}
          </Text>
        )}

        {/* Date d'expiration */}
        <Text style={styles.expiry}>
          {formatEndDate(promotion.endDate)}
        </Text>
      </View>

      <View style={styles.arrow}>
        <Icon
          name="chevron-right"
          type="material-community"
          color={colors.text.secondary}
          size={20}
        />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: colors.border.light,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  condition: {
    fontSize: 12,
    color: colors.text.muted,
    fontStyle: 'italic',
    marginBottom: 4,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  expiry: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '500',
    backgroundColor: colors.highlight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  arrow: {
    marginLeft: 12,
  },
})
