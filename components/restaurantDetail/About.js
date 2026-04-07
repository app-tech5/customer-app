import { View, Text, ImageBackground, StyleSheet, TouchableOpacity, Platform} from 'react-native'
import React, { useEffect, useState } from 'react'
import { Icon } from 'react-native-elements';
import RestaurantDetailComponent from '../RestaurantDetailComponent';
import { getCategoriesFromRestaurant } from '../../api';
import i18n from '../../lang/i18n';

export default function About(props) {
  const {restaurant} = props.route.params
  const {name, price, review_count, rating, collectTime} = restaurant;
  const [restaurantDetail, setRestaurantDetail] = useState(false)
  
  const [categories, setCategories] = useState()
let description;
 if(categories)
description = `⭐${parseFloat(rating).toFixed(1)} (${review_count}+ ratings) • ${categories[0].name} •${price}• 🎫`
useEffect(()=> {
  getCategoriesFromRestaurant(restaurant.restaurantId)
  .then(categories => {
    setCategories(categories)
  })
}, [])
return (
    <View style={styles.container}>
      <RestaurantName name={name}/>
      <TouchableOpacity onPress={()=>setRestaurantDetail(true)}>
      <RestaurantDescription 
      description={description} 
      collectTime={collectTime}
      />
      <View style={styles.open}>
        <Text style={styles.openText}>{i18n.t('restaurant.openUntil', { time: '2:00 AM' })}</Text>
        </View>
      </TouchableOpacity>
       <RestaurantDetailComponent restaurant={restaurant} 
       visible={restaurantDetail} setVisible={setRestaurantDetail}
       userLocation={props.userLocation} mapRef={props.mapRef} apikey={props.apikey}/>
    </View>
  )
}
export const ArrowBack = (props)=>{
  return (
    <View style={styles.view2}>
    <Icon
      name="arrow-left"
      type="material-community"
      color="black"
      size={25}
      onPress={() => {
        if (props.navigation.canGoBack()) {
          props.navigation.goBack()
          return
        }

        props.navigation.navigate('SearchFlow', { screen: 'SearchScreen' })
      }}

    />
</View>
  )
}
export const RestaurantName = (props) => (
<Text style={{
    fontSize: 29,
    fontWeight:Platform.OS === "android"?"bold":"600",
    marginTop: 10, 
}}
>{props.name}</Text>
)
export const RestaurantDescription = (props)=>(
      <View style={styles.description}>
        <Text style={props.style?{...props.style}:styles.textDescription}>{props.description}</Text>
      </View>
)
const styles = StyleSheet.create({
  container: {
    marginHorizontal: 10
  },
  view2: {
    backgroundColor: "white",
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    margin: 10,
  },
  textDescription: {
    fontWeight:Platform.OS === "android"?"bold":"400",
    fontSize: 15.5,
  },
  openText: {
    fontSize: 14.5,
    color: "grey",
  },
  open: {
   marginBottom: 10
  }
})
