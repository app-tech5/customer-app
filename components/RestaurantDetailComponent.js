import React from 'react'
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native'
import { Divider, Icon } from 'react-native-elements'
import RestaurantName from './RestaurantName'
import RestaurantDescription from './RestaurantDescription'
import { colors, currency, formatRestaurantRatingSummary } from '../global'
import i18n from '../lang/i18n'
import {
  calculateDeliveryFeeFromSetting,
  hasDeliverySetting,
  usesDynamicDeliveryFee,
} from '../utils/deliverySetting'

const { height } = Dimensions.get('window')

export default function RestaurantDetailComponent({
  restaurant,
  deliverySetting = null,
  visible,
  setVisible,
  deliveryTime,
  distance = null,
}) {
  const {
    name,
    description,
    review_count,
    rating,
    collectTime,
    openingTime,
    closingTime,
  } = restaurant

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A'
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour =
      hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const openingTimeFormatted = formatTime(openingTime)
  const closingTimeFormatted = formatTime(closingTime)

  const distanceKm = distance ?? restaurant.distance ?? null
  const deliveryFee = calculateDeliveryFeeFromSetting(deliverySetting, distanceKm)
  const dynamicFee = usesDynamicDeliveryFee(deliverySetting)
  const dyn = deliverySetting?.dynamicDeliveryFee || {}

  const restaurantDescription =
    description && description.trim() !== ''
      ? description
      : 'Restaurant description not available'

  const formatMoney = (amount) =>
    Number(amount).toLocaleString('en', { style: 'currency', currency })

  return (
    <Modal
      animationType="slide"
      visible={visible}
      transparent
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setVisible(false)}
          style={styles.backdrop}
        />

        <View style={styles.container}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setVisible(false)}
              >
                <Icon
                  name="close"
                  type="material-community"
                  color={colors.text.primary}
                  size={22}
                />
              </TouchableOpacity>
              <RestaurantName name={name} />
            </View>

            <View style={styles.descriptionWrapper}>
              <RestaurantDescription description={restaurantDescription} />
            </View>

            <Divider style={styles.divider} />

            <RestaurantInfo
              iconName="clock-outline"
              iconType="material-community"
              iconSize={22}
              text={`Open ${openingTimeFormatted} - ${closingTimeFormatted}`}
            />

            <RestaurantInfo
              iconName="star"
              iconType="FontAwesome"
              iconSize={20}
              text={`⭐ ${formatRestaurantRatingSummary(rating, review_count)}`}
            />

            <RestaurantInfo
              iconName="timer-outline"
              iconType="material-community"
              iconSize={22}
              text={`Preparation time: ${collectTime} min`}
            />

            <RestaurantInfo
              iconName="clock-outline"
              iconType="material-community"
              iconSize={22}
              text={`Delivery time: ${deliveryTime.min}-${deliveryTime.max} min`}
            />

            <View style={styles.deliveryDetailsContainer}>
              <View style={styles.deliveryDetailsHeader}>
                <Icon
                  name="information-outline"
                  type="material-community"
                  color={colors.primary}
                  size={20}
                />
                <Text style={styles.deliveryDetailsTitle}>
                  {i18n.t('restaurant.deliveryFeeDetails')}
                </Text>
              </View>

              {hasDeliverySetting(deliverySetting) ? (
                <View style={styles.deliveryBreakdown}>
                  {!dynamicFee ? (
                    <View style={styles.feeRow}>
                      <Text style={styles.feeLabel}>{i18n.t('restaurant.fixedFee')}</Text>
                      <Text style={styles.feeValue}>
                        {formatMoney(deliverySetting.fixedDeliveryFee || 0)}
                      </Text>
                    </View>
                  ) : null}

                  {dynamicFee && distanceKm != null && (
                    <>
                      <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>
                          {i18n.t('restaurant.baseDistanceFee')}
                        </Text>
                        <Text style={styles.feeValue}>
                          {formatMoney(dyn.baseFee || 0)}
                        </Text>
                      </View>

                      <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>
                          {i18n.t('restaurant.distanceFee', {
                            distance: Number(distanceKm).toFixed(1),
                            rate: Number(dyn.perKmFee) || 0,
                          })}
                        </Text>
                        <Text style={styles.feeValue}>
                          {formatMoney((Number(distanceKm) || 0) * (Number(dyn.perKmFee) || 0))}
                        </Text>
                      </View>
                    </>
                  )}

                  {deliverySetting.freeDeliveryEnabled ? (
                    <View style={styles.freeDeliveryRow}>
                      <Icon
                        name="check-circle"
                        type="material-community"
                        color="#4CAF50"
                        size={16}
                      />
                      <Text style={styles.freeDeliveryText}>
                        {i18n.t('restaurant.freeDelivery')}
                        {deliverySetting.freeDeliveryThreshold > 0
                          ? ` (${formatMoney(deliverySetting.freeDeliveryThreshold)}+)`
                          : ''}
                      </Text>
                    </View>
                  ) : null}

                  <Divider style={styles.feeDivider} />

                  <View style={[styles.feeRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>
                      {i18n.t('restaurant.totalDeliveryFee')}
                    </Text>
                    <Text style={styles.totalValue}>{formatMoney(deliveryFee)}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.noDeliveryOptions}>
                  {i18n.t('restaurant.noDeliveryOptions')}
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const RestaurantInfo = ({ iconName, iconType, iconSize, text }) => (
  <>
    <View style={styles.restaurantInfo}>
      <Icon name={iconName} type={iconType} size={iconSize} />
      <Text style={styles.restaurantInfoText}>{text}</Text>
    </View>
    <Divider style={styles.divider} />
  </>
)

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },

  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  container: {
    marginTop: 'auto',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },

  scrollContent: {
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  descriptionWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },

  restaurantInfoText: {
    marginLeft: 14,
    fontSize: 16,
    color: colors.text.primary,
  },

  divider: {
    marginHorizontal: 20,
  },

  deliveryDetailsContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },

  deliveryDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  deliveryDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 8,
  },

  deliveryBreakdown: {
    gap: 8,
  },

  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },

  feeLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },

  feeValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },

  freeDeliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#E8F5E8',
    borderRadius: 6,
    paddingHorizontal: 8,
  },

  freeDeliveryText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },

  feeDivider: {
    marginVertical: 8,
    backgroundColor: colors.border.medium,
  },

  totalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border.medium,
  },

  totalLabel: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
  },

  totalValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },

  noDeliveryOptions: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
    paddingVertical: 8,
  },
})
