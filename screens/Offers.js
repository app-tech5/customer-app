import { View, Text, StyleSheet, ScrollView, StatusBar, Platform} from 'react-native'
import React from 'react'
import { AntDesign } from '@expo/vector-icons'
import { ArrowBack } from '../components/restaurantDetail/About'
import {restaurants} from '../data'
import { RestaurantInfo, RestaurantImage} from '../components/home/RestaurantItems'
import Reward from '../components/Reward'

export default function Offers({navigation}) {
  return (
    <View style={styles.container}>
      <View style={styles.arrow_title}>
          <ArrowBack navigation={navigation}/>
          <Text style={styles.title}>Deals</Text>
           
      </View>
      <ScrollView >
              {restaurants.map((restaurant, index)=>

               <View key={index} style={styles.restaurantsContainer}>
                   <RestaurantImage image={restaurant.image_url} />
                   <RestaurantInfo
                                name={restaurant.name}
                                rating={restaurant.rating}
                                city={restaurant.location.city}/>
                      <Reward restaurant={restaurant}/>
               </View>

              )}
          </ScrollView>
    </View>
  )
}


const styles = StyleSheet.create({
    container:{
    
    marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    marginHorizontal: 10

    },
    arrow_title: {
      flexDirection: "row" ,
      alignItems: "center",

    },
    title: {
       marginLeft : 20,
        fontSize: 25
    },
    restaurantsContainer: {
        marginVertical: 10
    }, 
    
    
    
    
    
    
         
    
    
    
    
    
    
    

})