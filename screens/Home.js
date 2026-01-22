import { View, Text, SafeAreaView, StatusBar, ScrollView, StyleSheet, Platform, TouchableOpacity} from 'react-native'
import React, {useState, useEffect, useRef, useContext} from 'react'
import HeaderTabs from '../components/home/HeaderTabs'
import SearchBar from '../components/home/SearchBar'
import RestaurantItems, { localRestaurants } from '../components/home/RestaurantItems'
import { Divider } from 'react-native-elements'
// Données backend seulement - plus de données statiques
import HomeHeader from '../components/home/HomeHeader'
import { getRestaurantsFromFirebase, getAllPromotions, getAllMenuItems } from '../api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AntDesign } from '@expo/vector-icons'
import Loader from './Loader'
import { RestaurantsContext } from '../contexts/RestaurantsContext'

export default function Home({navigation}) {
  const {restaurantData, setRestaurantData} = useContext(RestaurantsContext)
  const [city, setCity] = useState("Paris");
  const [activeTab, setActiveTab]= useState("Delivery")
  const [allPromotions, setAllPromotions] = useState([])
  const [allMenus, setAllMenus] = useState([])
  const flatlist = useRef(null)
  const searchbar = useRef(null)
  useEffect(()=>{
    // Charger les restaurants directement depuis l'API (pas de cache)
    getRestaurantsFromFirebase()
      .then(async (restaurants)=>{
        setRestaurantData(restaurants)

        // Charger TOUTES les promotions et menus en parallèle
        try {
          const [promotions, menus] = await Promise.all([
            getAllPromotions(),
            getAllMenuItems()
          ]);
          setAllPromotions(promotions || []);
          setAllMenus(menus || []);
          console.log('🏷️ All promotions loaded:', promotions?.length || 0);
          console.log('🍽️ All menus loaded:', menus?.length || 0);
        } catch (error) {
          console.error('Error loading promotions and menus:', error);
          setAllPromotions([]);
          setAllMenus([]);
        }
      })
      .catch(error => {
        console.error('Error loading restaurants:', error);
        setRestaurantData([]); // Liste vide par défaut
        setAllPromotions([]);
      });
  },[])

  // Créer des sections dynamiques basées sur les données backend uniquement
  const createDynamicSections = React.useMemo(() => {
    if (!restaurantData || restaurantData.length === 0) return []

    const sections = []

    // 1. Section "Offres spéciales" - Restaurants avec promotions actives du backend
    const restaurantsWithPromotions = restaurantData.filter(restaurant => {
      const restaurantId = restaurant.restaurantId || restaurant.id || restaurant._id
      return allPromotions?.some(promotion =>
        promotion.restaurantId === restaurantId &&
        promotion.isActive &&
        new Date() >= new Date(promotion.startDate) &&
        new Date() <= new Date(promotion.endDate)
      )
    })

    if (restaurantsWithPromotions.length > 0) {
      sections.push({
        id: 'special_offers',
        title: '🎉 Offres spéciales',
        restaurants: restaurantsWithPromotions.slice(0, 8),
        type: 'promotions'
      })
    }

    // 2. Section "Les mieux notés" - Restaurants avec rating >= 4.5
    const topRated = restaurantData
      .filter(restaurant => restaurant.rating && parseFloat(restaurant.rating) >= 4.5)
      .sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0))

    if (topRated.length > 0) {
      sections.push({
        id: 'top_rated',
        title: '⭐ Les mieux notés',
        restaurants: topRated.slice(0, 8),
        type: 'rating'
      })
    }

    // 3. Section "Livraison rapide" - Restaurants avec deliveryTime court
    const fastDelivery = restaurantData
      .filter(restaurant => restaurant.deliveryTime && parseInt(restaurant.deliveryTime) <= 25)
      .sort((a, b) => parseInt(a.deliveryTime || 0) - parseInt(b.deliveryTime || 0))

    if (fastDelivery.length > 0) {
      sections.push({
        id: 'fast_delivery',
        title: '🚀 Livraison rapide',
        restaurants: fastDelivery.slice(0, 8),
        type: 'delivery'
      })
    }

    // 4. Section "Cuisine rapide" - Restaurants avec collectTime <= 15 min
    const quickPickup = restaurantData
      .filter(restaurant => restaurant.collectTime && parseInt(restaurant.collectTime) <= 15)
      .sort((a, b) => parseInt(a.collectTime || 0) - parseInt(b.collectTime || 0))

    if (quickPickup.length > 0) {
      sections.push({
        id: 'quick_pickup',
        title: '⚡ Cuisine rapide',
        restaurants: quickPickup.slice(0, 8),
        type: 'pickup'
      })
    }

    // 5. Section "Populaires près de chez vous" - Restaurants populaires
    const popularNearby = restaurantData
      .filter(restaurant => restaurant.review_count && parseInt(restaurant.review_count) > 100)
      .sort((a, b) => parseInt(b.review_count || 0) - parseInt(a.review_count || 0))

    if (popularNearby.length > 0) {
      sections.push({
        id: 'popular_nearby',
        title: '🔥 Populaires près de chez vous',
        restaurants: popularNearby.slice(0, 8),
        type: 'popular'
      })
    }

    // 6. Section "Découvrir" - Restaurants diversifiés
    const discover = restaurantData.slice(0, 12)
    sections.push({
      id: 'discover',
      title: '🍽️ Découvrir',
      restaurants: discover,
      type: 'discover'
    })

    return sections
  }, [restaurantData, allPromotions])
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
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Affichage dynamique des sections basées sur les données backend - comme Uber Eats */}
          {createDynamicSections.map((section) => (
            <View key={section.id}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <TouchableOpacity
                  onPress={() => {
                    // Navigation vers une vue détaillée de la section
                    navigation.navigate('SearchResults', {
                      searchTerm: section.title,
                      restaurantData: section.restaurants,
                      totalResults: section.restaurants.length,
                      sectionType: section.id
                    })
                  }}
                >
                  <Text style={styles.seeAllText}>Voir tout</Text>
                </TouchableOpacity>
              </View>
              <RestaurantItems
                restaurantData={section.restaurants}
                promotions={allPromotions}
                allMenus={allMenus}
                navigation={navigation}
                horizontal={true}
                size="100%"
              />
            </View>
          ))}
        </ScrollView>
      <Divider width={1}/>
     </View>
     </SafeAreaView>
  )
}
// RestaurantRowsItems supprimé - remplacé par createDynamicSections
const styles = StyleSheet.create({
  row: {backgroundColor: "white", marginTop: 8},
  rowsTitle: {fontSize: 25, paddingLeft: 15, fontFamily: "Roboto_700Bold", paddingTop: 15},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600'
  }
})
 