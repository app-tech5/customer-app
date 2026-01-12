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
import { colors } from '../global'

const { height } = Dimensions.get('window')

export default function RestaurantDetailComponent({
  restaurant,
  visible,
  setVisible,
  deliveryTime,
  deliveryFee
}) {
  const {
    name,
    description,
    review_count,
    rating,
    collectTime,
    openingTime,
    closingTime
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

  const restaurantDescription =
    description && description.trim() !== ''
      ? description
      : 'Restaurant description not available'

  return (
    <Modal
      animationType="slide"
      visible={visible}
      transparent
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>

        {/* Backdrop FULL HEIGHT */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setVisible(false)}
          style={styles.backdrop}
        />

        {/* Bottom Sheet */}
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
              <RestaurantDescription
                description={restaurantDescription}
              />
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
              text={`⭐ ${Number(rating).toFixed(1)} (${review_count}+ ratings)`}
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

            <RestaurantInfo
              iconName="currency-usd"
              iconType="material-community"
              iconSize={22}
              text={`Delivery fee: ${Number(deliveryFee).toLocaleString(
                'en',
                { style: 'currency', currency: 'USD' }
              )}`}
            />
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
    flex: 1
  },

  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height,
    backgroundColor: 'rgba(0,0,0,0.6)'
  },

  container: {
    marginTop: 'auto',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%'
  },

  scrollContent: {
    paddingBottom: 40
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },

  descriptionWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 24
  },

  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18
  },

  restaurantInfoText: {
    marginLeft: 14,
    fontSize: 16,
    color: colors.text.primary
  },

  divider: {
    marginHorizontal: 20
  }
})
