import { View, Text, Modal, StyleSheet} from 'react-native'
import React, {useContext} from 'react'
import { CloseModal, Icon } from './FilterModal'


import { Divider, } from 'react-native-elements'
import DisplayMapview from './DisplayMapview'
import RestaurantName from './RestaurantName'
import RestaurantDescription from './RestaurantDescription'
import { CategoriesContext } from '../contexts/CategoriesContext';


export default function RestaurantDetailComponent({restaurant, visible, setVisible, userLocation, mapRef, apikey}) {

    const {name, image_url, price, review_count, rating, collectTime, address, deliveryTime} = restaurant;
    
    const {categories, setCategories} = useContext(CategoriesContext)

    let formattedCategories;
    
    if(categories)
    formattedCategories = categories.map((cat)=>cat.name).join(' • ')

  

    const description = formattedCategories + ' '+price
  return (

      <Modal animationType='slide' visible={visible} >
        < DisplayMapview height={200} userLocation={userLocation} mapRef={mapRef} apikey={apikey} restaurant={restaurant} />

          <View style={styles.container}>
              <View style={styles.header}>
                  <CloseModal setVisible={setVisible} />
                  <RestaurantName name={name} />
              </View>
              <View style={styles.header1}>
                  <RestaurantDescription
                      description={description}
                      style={styles.description}
                  />
              </View>
              <Divider />
              <RestaurantInfo iconName="location-pin" iconType="Entypo"
                  iconSize={35} 
                
                text={address}
                  />

              <RestaurantInfo iconName="time" iconType="Ionicons"
                  iconSize={35} text="Open until 9:00 AM" />

              <RestaurantInfo iconName="star" iconType="FontAwesome"
                  iconSize={35} text={`⭐${rating} (${review_count}+ ratings)`} />

<RestaurantInfo iconName="timer" iconType="Ionicons"
                  iconSize={35} text={"Collect time: "+ collectTime+" min"}/>

                  <RestaurantInfo iconName="delivery-dining" iconType="MaterialIcons"
                  iconSize={35} text={"Delivery time: "+ deliveryTime+" min"}/>
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
    container: {
      marginHorizontal: 10
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
      flexDirection: "row"  ,
      alignItems: "center",
      marginHorizontal: 10,
      marginVertical: 20

    },
    restaurantInfoText: {
        marginLeft: 10,
        fontSize: 20
    }
    
})