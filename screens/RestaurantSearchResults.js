import { View, Text, StyleSheet, StatusBar, Platform} from 'react-native'
import React from 'react'
import RestaurantItems from '../components/home/RestaurantItems'
import HeaderTabs from '../components/home/HeaderTabs'
import HomeHeader from '../components/home/HomeHeader'
import SearchBar from '../components/home/SearchBar'

export default function RestaurantSearchResults({route, navigation}) {

    const {restaurantData} = route.params
  return (
      <View style={styles.container}>
          <View style={{ backgroundColor: "white", padding: 15 }}>

              <HomeHeader navigation={navigation} />
              
          </View>
          <RestaurantItems restaurantData={restaurantData} navigation={navigation} size="100%" />
      </View>
    
  )
}

const styles = StyleSheet.create({
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
})