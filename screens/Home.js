import { View, Text, SafeAreaView, StatusBar, ScrollView, StyleSheet, Platform, TouchableOpacity} from 'react-native'
import React, {useState, useEffect, useRef, useContext} from 'react'
import { Icon } from 'react-native-elements'
import i18n from '../i18n'
import HeaderTabs from '../components/home/HeaderTabs'
import SearchBar from '../components/home/SearchBar'
import RestaurantItems, { localRestaurants } from '../components/home/RestaurantItems'
import { Divider } from 'react-native-elements'
import { colors } from '../global'
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
  const [appliedFilters, setAppliedFilters] = useState(null)
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

  // Fonction pour appliquer les filtres aux restaurants
  const applyFiltersToRestaurants = (restaurants) => {
    return restaurants
  }

  // Fonction pour trier les restaurants
  const sortRestaurants = (restaurants) => {
    if (!appliedFilters?.sort) {
      return restaurants
    }

    const sorted = [...restaurants]

    if (appliedFilters.sort === 'popular') {
      return sorted.sort((a, b) => {
        const aCount = parseInt(a.review_count) || 0
        const bCount = parseInt(b.review_count) || 0
        return bCount - aCount  // Tri décroissant : plus d'avis = mieux
      })
    }

    return restaurants
  }

  const handleApplyFilters = (filters) => {
    console.log('🎯 Applying filters from modal:', filters)
    setAppliedFilters(filters)
  }

  // Créer des sections dynamiques basées sur les données backend uniquement
  const createDynamicSections = React.useMemo(() => {
    if (!restaurantData || restaurantData.length === 0) return []

    // Appliquer les filtres aux données
    const filteredData = appliedFilters ? applyFiltersToRestaurants(restaurantData) : restaurantData
    const sortedData = appliedFilters ? sortRestaurants(filteredData) : filteredData

    const sections = []

    // 1. Section "Offres spéciales" - Restaurants avec promotions actives du backend
    const restaurantsWithPromotions = sortedData.filter(restaurant => {
      const restaurantId = restaurant.restaurantId || restaurant.id || restaurant._id
      return allPromotions?.some(promotion =>
        promotion.restaurantId === restaurantId &&
        promotion.isActive &&
        new Date() >= new Date(promotion.startDate) &&
        new Date() <= new Date(promotion.endDate)
      )
    })

    if (restaurantsWithPromotions.length >= 2) {
      sections.push({
        id: 'special_offers',
        title: i18n.t('home.sections.specialOffers'),
        icon: 'local-offer',
        restaurants: restaurantsWithPromotions.slice(0, 8),
        type: 'promotions'
      })
    }

    // 2. Section "Les mieux notés" - Restaurants avec rating >= 4.5
    const topRated = sortedData
      .filter(restaurant => restaurant.rating && parseFloat(restaurant.rating) >= 4.5)
      .sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0))

    if (topRated.length >= 2) {
      sections.push({
        id: 'top_rated',
        title: i18n.t('home.sections.topRated'),
        icon: 'star',
        restaurants: topRated.slice(0, 8),
        type: 'rating'
      })
    }

    // 3. Section "Cuisine rapide" - Restaurants avec collectTime <= 25 min (moyenne 29min)
    const quickCuisine = sortedData
      .filter(restaurant => restaurant.collectTime && parseInt(restaurant.collectTime) <= 25)
      .sort((a, b) => parseInt(a.collectTime || 0) - parseInt(b.collectTime || 0))

    if (quickCuisine.length >= 2) {
      sections.push({
        id: 'quick_cuisine',
        title: i18n.t('home.sections.quickCuisine'),
        icon: 'flash',
        restaurants: quickCuisine.slice(0, 8),
        type: 'cuisine'
      })
    }

    // 4. Section "À emporter express" - Restaurants avec collectTime <= 20 min
    const expressPickup = sortedData
      .filter(restaurant => restaurant.collectTime && parseInt(restaurant.collectTime) <= 20)
      .sort((a, b) => parseInt(a.collectTime || 0) - parseInt(b.collectTime || 0))

    if (expressPickup.length >= 2) {
      sections.push({
        id: 'express_pickup',
        title: i18n.t('home.sections.expressPickup'),
        icon: 'run',
        restaurants: expressPickup.slice(0, 8),
        type: 'pickup'
      })
    }

    // 5. Section "Les plus populaires" - Restaurants avec le plus d'avis (> 150 avis)
    const mostPopular = sortedData
      .filter(restaurant => restaurant.review_count && parseInt(restaurant.review_count) > 150)
      .sort((a, b) => parseInt(b.review_count || 0) - parseInt(a.review_count || 0))

    if (mostPopular.length >= 2) {
      sections.push({
        id: 'most_popular',
        title: i18n.t('home.sections.mostPopular'),
        icon: 'trending-up',
        restaurants: mostPopular.slice(0, 8),
        type: 'popular'
      })
    }

    // 6. Section "Cuisine italienne" - Basé sur les données (8 restaurants italiens)
    const italianRestaurants = sortedData.filter(restaurant =>
      restaurant.categories?.some(cat =>
        cat.title?.toLowerCase().includes('italian') || cat.title?.toLowerCase().includes('pizza')
      )
    )
    if (italianRestaurants.length >= 2) {
      sections.push({
        id: 'italian_cuisine',
        title: i18n.t('home.sections.italianCuisine'),
        icon: 'food-variant',
        restaurants: italianRestaurants.slice(0, 8),
        type: 'category'
      })
    }

    // 7. Section "Cuisine américaine" - Basé sur les données (7 restaurants américains)
    const americanRestaurants = sortedData.filter(restaurant =>
      restaurant.categories?.some(cat =>
        cat.title?.toLowerCase().includes('american') || cat.title?.toLowerCase().includes('fast food')
      )
    )
    if (americanRestaurants.length >= 2) {
      sections.push({
        id: 'american_cuisine',
        title: i18n.t('home.sections.americanCuisine'),
        icon: 'hamburger',
        restaurants: americanRestaurants.slice(0, 8),
        type: 'category'
      })
    }

    // 8. Section "Découvrir" - Restaurants diversifiés (toujours affichée si on a au moins 3 restaurants)
    if (sortedData.length >= 3) {
      const discover = sortedData.slice(0, 12)
      sections.push({
        id: 'discover',
        title: i18n.t('home.sections.discover'),
        icon: 'compass-outline',
        restaurants: discover,
        type: 'discover'
      })
    }

    return sections
  }, [restaurantData, allPromotions, appliedFilters])
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
       <HomeHeader navigation={navigation} onApplyFilters={handleApplyFilters}/>
        <SearchBar cityHandler={setCity} navigation={navigation} restaurantData={restaurantData} searchbar={searchbar}/>
      </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Affichage dynamique des sections basées sur les données backend - comme Uber Eats */}
          {createDynamicSections.map((section) => (
            <View key={section.id} style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  {section.icon && (
                    <Icon
                      name={section.icon}
                      type="material-community"
                      size={20}
                      color={colors.primary}
                      style={styles.sectionIcon}
                    />
                  )}
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    // Navigation vers une vue détaillée de la section via le stack Search
                    navigation.navigate('Search', {
                      screen: 'SearchResults',
                      params: {
                        searchTerm: section.title,
                        restaurantData: section.restaurants,
                        totalResults: section.restaurants.length,
                        sectionType: section.id
                      }
                    })
                  }}
                >
                  <Text style={styles.seeAllText}>{i18n.t('home.viewAll')}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.restaurantList}>
                <RestaurantItems
                  restaurantData={section.restaurants}
                  promotions={allPromotions}
                  allMenus={allMenus}
                  navigation={navigation}
                  horizontal={true}
                  size={0.75}
                />
              </View>
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
    paddingTop: 25,
    paddingBottom: 12,
    backgroundColor: '#fff'
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  sectionIcon: {
    marginRight: 8
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5
  },
  seeAllText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600'
  },
  sectionContainer: {
    marginBottom: 8,
    backgroundColor: '#fff'
  },
  restaurantList: {
    paddingLeft: 20,
    paddingBottom: 20
  }
})
 