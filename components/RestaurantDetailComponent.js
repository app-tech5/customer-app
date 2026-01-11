import { View, Text, Modal, StyleSheet, ScrollView} from 'react-native'
import React from 'react'
import { CloseModal } from './FilterModal'
import { Divider, Icon } from 'react-native-elements'
import RestaurantName from './RestaurantName'
import RestaurantDescription from './RestaurantDescription'

export default function RestaurantDetailComponent({restaurant, visible, setVisible}) {

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
          <View style={styles.modalOverlay} onTouchEnd={() => setVisible(false)}>
              <View style={styles.container} onTouchEnd={() => {}}>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                      <View style={styles.header}>
                          <CloseModal setVisible={setVisible} />
                          <RestaurantName name={name} />
                      </View>
                      <View style={styles.header1}>
                          <RestaurantDescription
                              description={restaurantDescription}
                              style={styles.description}
                          />
                      </View>
                      <Divider />
                      <RestaurantInfo iconName="location-pin" iconType="Entypo"
                          iconSize={35}
                          text={address}
                          />

                      <RestaurantInfo iconName="clock-outline" iconType="material-community"
                          iconSize={35} text={`Open ${openingTimeFormatted} - ${closingTimeFormatted}`} />

                      <RestaurantInfo iconName="star" iconType="FontAwesome"
                          iconSize={35} text={`⭐${rating} (${review_count}+ ratings)`} />

                      <RestaurantInfo iconName="timer-outline" iconType="material-community"
                          iconSize={35} text={"Preparation time: "+ collectTime+" min"}/>
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
        marginTop: 20,
    },
    header1: {
        marginTop: 10,
        marginBottom: 25
    },
    description: {
        color: "grey",
        fontSize: 15.5,
    },
    restaurantInfo: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 10,
        marginVertical: 20
    },
    restaurantInfoText: {
        marginLeft: 10,
        fontSize: 20
    }
})