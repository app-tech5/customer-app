import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { Icon } from 'react-native-elements'
import { colors } from '../../global'

export default function PromotionCard({ promotion }) {
  // Formater le type de promotion pour l'affichage
  const getPromotionDisplay = () => {
    switch (promotion.promotionType) {
      case 'percentage_discount':
        return {
          title: `${promotion.discountValue}% OFF`,
          subtitle: promotion.description || `Réduction de ${promotion.discountValue}%`,
          icon: 'percent',
          color: colors.accent
        }
      case 'fixed_discount':
        return {
          title: `€${promotion.discountValue} OFF`,
          subtitle: promotion.description || `Réduction de €${promotion.discountValue}`,
          icon: 'cash',
          color: colors.success
        }
      case 'free_delivery':
        return {
          title: 'LIVRAISON GRATUITE',
          subtitle: promotion.description || 'Profitez de la livraison gratuite',
          icon: 'truck-delivery',
          color: colors.primary
        }
      case 'buy_x_get_y':
        return {
          title: `BUY ${promotion.buyQuantity} GET ${promotion.getQuantity}`,
          subtitle: promotion.description || `Achetez ${promotion.buyQuantity}, recevez ${promotion.getQuantity} gratuit(s)`,
          icon: 'gift',
          color: colors.secondary
        }
      case 'combo_deal':
        return {
          title: 'COMBO',
          subtitle: promotion.description || 'Offre spéciale combo',
          icon: 'food',
          color: colors.warning
        }
      case 'flash_sale':
        return {
          title: 'VENTE FLASH',
          subtitle: promotion.description || 'Offre limitée dans le temps',
          icon: 'clock-time-eight',
          color: colors.error
        }
      case 'happy_hour':
        return {
          title: 'HAPPY HOUR',
          subtitle: promotion.description || 'Réduction heure creuse',
          icon: 'clock',
          color: colors.info
        }
      default:
        return {
          title: 'PROMOTION',
          subtitle: promotion.description || 'Offre spéciale',
          icon: 'tag',
          color: colors.accent
        }
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

    if (diffDays <= 0) return 'Expiré'
    if (diffDays === 1) return 'Expire aujourd\'hui'
    if (diffDays <= 7) return `Expire dans ${diffDays} jours`
    return `Jusqu'au ${date.toLocaleDateString()}`
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

        {/* Conditions si elles existent */}
        {promotion.minOrderAmount && (
          <Text style={styles.condition}>
            Minimum: €{promotion.minOrderAmount}
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
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 20,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 4,
  },
  condition: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  expiry: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '500',
  },
  arrow: {
    marginLeft: 8,
  },
})
