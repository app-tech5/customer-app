import { View, Text, SafeAreaView, StatusBar, ScrollView, StyleSheet, Platform} from 'react-native'
import React, {useState, useEffect, useRef, useContext} from 'react'
import HeaderTabs from '../components/home/HeaderTabs'
import SearchBar from '../components/home/SearchBar'
import Categories from '../components/home/Categories'
import RestaurantItems, { localRestaurants } from '../components/home/RestaurantItems'
import { Divider } from 'react-native-elements'
import { restaurants, themes } from '../data'
import HomeHeader from '../components/home/HomeHeader'
import { getRestaurantsFromFirebase, getAllPromotions } from '../api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AntDesign } from '@expo/vector-icons'
import Loader from './Loader'
import { RestaurantsContext } from '../contexts/RestaurantsContext'

export default function Home({navigation}) {
  const {restaurantData, setRestaurantData} = useContext(RestaurantsContext)
  const [city, setCity] = useState("Paris");
  const [activeTab, setActiveTab]= useState("Delivery")
  const [allPromotions, setAllPromotions] = useState([])
  const flatlist = useRef(null)
  const searchbar = useRef(null)
  useEffect(()=>{
    // Charger les restaurants directement depuis l'API (pas de cache)
    getRestaurantsFromFirebase()
      .then(async (restaurants)=>{
        setRestaurantData(restaurants)

        // Charger TOUTES les promotions en un seul appel API
        try {
          const promotions = await getAllPromotions();
          setAllPromotions(promotions || []);
          console.log('🏷️ All promotions loaded in one call:', promotions?.length || 0);
        } catch (error) {
          console.error('Error loading all promotions:', error);
          setAllPromotions([]);
        }
      })
      .catch(error => {
        console.error('Error loading restaurants:', error);
        setRestaurantData([]); // Liste vide par défaut
        setAllPromotions([]);
      });
  },[])
  if(!restaurantData)
  return <Loader />
  return (
    <SafeAreaView style={{
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      backgroundColor: "#eee",
      flex: 1
    }}>
     <View style={{flex: 1}}>
      <View style={{ backgroundColor: "white", padding: 15 }}>
        <HeaderTabs activeTab={activeTab} setActiveTab={setActiveTab} navigation={navigation} restaurantData={restaurantData} setCity={setCity} searchbar={searchbar}/>
       <HomeHeader navigation={navigation}/>
        <SearchBar cityHandler={setCity} navigation={navigation} restaurantData={restaurantData} searchbar={searchbar}/>
      </View>
       {city?
       <>
        <Categories navigation={navigation}/>
       <RestaurantItems restaurantData={restaurantData} navigation={navigation} promotions={allPromotions} size="100%"/>
       </>
       :
        <ScrollView showsVerticalScrollIndicator={false}>
          <RestaurantItems restaurantData={restaurantData} promotions={allPromotions} reward="$60 until $9 reward" navigation={navigation} size="100%" horizontal={true}/>
          <RestaurantItems restaurantData={restaurantData} promotions={allPromotions} navigation={navigation} ads={true} size="100%" flatlist={flatlist} horizontal={true}/>
          <RestaurantRowsItems themes={themes} restaurantData={restaurantData} navigation={navigation} />
        </ScrollView>}
      <Divider width={1}/>
     </View>
     </SafeAreaView>
  )
}
const RestaurantRowsItems = ({themes, restaurantData, navigation}) => {
  return themes.map((theme, index)=>{
      return(
        <View key={index}>
          <View style={styles.row}>
            <RestaurantItems restaurantData={restaurantData} promotions={allPromotions} navigation={navigation} horizontal={true} />
          </View>
        </View>
      )
    })
}
const styles = StyleSheet.create({
  row: {backgroundColor: "white", marginTop: 8},
  rowsTitle: {fontSize: 25, paddingLeft: 15, fontFamily: "Roboto_700Bold", paddingTop: 15}
})
 