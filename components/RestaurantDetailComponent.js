import { View, Text, Modal, StyleSheet, ScrollView, TouchableOpacity} from 'react-native'
import React from 'react'
import { CloseModal } from './FilterModal'
import { Divider, Icon } from 'react-native-elements'
import RestaurantName from './RestaurantName'
import RestaurantDescription from './RestaurantDescription'
import { colors } from '../global'

export default function RestaurantDetailComponent({restaurant, visible, setVisible, deliveryTime, deliveryFee, distance}) {

    const {name, description, review_count, rating, collectTime, address, openingTime, closingTime} = restaurant;

    // Formatage des horaires
    const formatTime = (timeString) => {
        if (!timeString) return 'N/A'
        const [hours, minutes] = timeString.split(':')
        const hour = parseInt(hours)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
        return `${displayHour}:${minutes} ${ampm}`
    }

    const openingTimeFormatted = formatTime(openingTime)
    const closingTimeFormatted = formatTime(closingTime)

    // Description du restaurant si elle existe
    const restaurantDescription = description && description.trim() !== ""
        ? description
        : "Restaurant description not available"

  return (

      <Modal animationType='slide' visible={visible} transparent={true}>
          <View
              style={styles.modalOverlay}
              onStartShouldSetResponder={() => true}
              onResponderRelease={() => setVisible(false)}
          >
              <View
                  style={styles.container}
                  onStartShouldSetResponder={() => true}
                  onResponderRelease={() => {}}
              >
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <View style={styles.header}>
                  <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setVisible(false)}
                      activeOpacity={0.7}
                  >
                      <Icon name="close" type="material-community" color={colors.text.primary} size={24} />
                  </TouchableOpacity>
                  <RestaurantName name={name} />
              </View>
                      <View style={styles.header1}>
                          <RestaurantDescription
                              description={restaurantDescription}
                              style={styles.description}
                          />
                      </View>
                      <Divider />

                      <RestaurantInfo iconName="clock-outline" iconType="material-community"
                          iconSize={24} text={`Open ${openingTimeFormatted} - ${closingTimeFormatted}`} />

                      <RestaurantInfo iconName="star" iconType="FontAwesome"
                          iconSize={24} text={`⭐${Number(rating).toFixed(1)} (${review_count}+ ratings)`} />

                      <RestaurantInfo iconName="timer-outline" iconType="material-community"
                          iconSize={24} text={"Preparation time: "+ collectTime+" min"}/>

                      {/* Informations de livraison */}
                      <RestaurantInfo iconName="clock-outline" iconType="material-community"
                          iconSize={24} text={`Delivery time: ${deliveryTime.min}-${deliveryTime.max} min${deliveryTime.distance > 0 ? ` (${deliveryTime.distance} km)` : ''}`}/>

                      <RestaurantInfo iconName="currency-usd" iconType="material-community"
                          iconSize={24} text={`Delivery fee: ${Number(deliveryFee).toLocaleString('en', { style: 'currency', currency: 'USD' })}`}/>
                  </ScrollView>
              </View>
          </View>
      </Modal>
  )
}

const RestaurantInfo = ({iconName, iconType, iconSize, text})=> {

    return (
        <>
            <View style={styles.restaurantInfo}>
                <Icon name={iconName} type={iconType} size={iconSize} />
                <Text style={styles.restaurantInfoText}>{text}</Text>
            </View>
            <Divider />
        </>
      
    )
    
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        marginHorizontal: 10,
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    header1: {
        marginTop: 10,
        marginBottom: 25,
        paddingHorizontal: 20
    },
    description: {
        color: "grey",
        fontSize: 15.5,
        paddingHorizontal: 20
    },
    restaurantInfo: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 10,
        marginVertical: 20
    },
    restaurantInfoText: {
        marginLeft: 12,
        fontSize: 16,
        color: colors.text.primary
    }
})