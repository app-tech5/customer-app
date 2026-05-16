import { View, Text, SafeAreaView, StatusBar, ScrollView, StyleSheet, Platform, TouchableOpacity} from 'react-native'
import React, {useState, useEffect, useRef, useContext} from 'react'
import { Icon } from 'react-native-elements'
import i18n from '../lang/i18n'
import HeaderTabs from '../components/home/HeaderTabs'
import SearchBar from '../components/home/SearchBar'
import RestaurantItems from '../components/home/RestaurantItems'
import { Divider } from 'react-native-elements'
import { colors } from '../global'
import { getDistanceKmBetweenUserAndRestaurant } from '../utils/deliveryTime'

import HomeHeader from '../components/home/HomeHeader'
import { getRestaurants, getAllPromotions, getAllMenuItems } from '../api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { loadRestaurantsWithSmartCache, loadPromotionsWithSmartCache, loadMenusWithSmartCache } from '../utils/cacheUtils'
import Loader from './Loader'
import { RestaurantsContext } from '../contexts/RestaurantsContext'
import * as Location from 'expo-location'
import SettingContext from '../contexts/SettingContext'

export default function Home({navigation}) {
  const {restaurantData, setRestaurantData} = useContext(RestaurantsContext)
  const [city, setCity] = useState("Paris");
  const [activeTab, setActiveTab]= useState("Delivery")
  const [allPromotions, setAllPromotions] = useState([])
  const [allMenus, setAllMenus] = useState([])
  const [appliedFilters, setAppliedFilters] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const flatlist = useRef(null)
  const searchbar = useRef(null)
  const { settings } = useContext(SettingContext)
  
  const getUserLocation = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData')
      if (userData) {
        const user = JSON.parse(userData)
        if (user.location && user.location.latitude && user.location.longitude) {
          const location = {
            lat: user.location.latitude,
            lng: user.location.longitude
          }
          setUserLocation(location)
          return
        }
      }
      
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      })

      const userPos = {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      }

      setUserLocation(userPos)

    } catch (error) {
      console.error('❌ Home - Erreur lors de la récupération de la position:', error)
    }
  }

  useEffect(()=>{
    
    getUserLocation()
    
    if(settings) {
    loadRestaurantsWithSmartCache(
      
      async () => {
        return await getRestaurants();
      },
      
      (restaurants, fromCache) => {
        setRestaurantData(restaurants);
      },
      
      (freshRestaurants) => {
        setRestaurantData(freshRestaurants);
      },
      
      null
    );
    
    loadPromotionsWithSmartCache(
      
      async () => {
        return await getAllPromotions();
      },
      
      (promotions, fromCache) => {
        setAllPromotions(promotions || []);
      },
      
      (freshPromotions) => {
        setAllPromotions(freshPromotions || []);
      },
      
      null
    );
    
    loadMenusWithSmartCache(
      
      async () => {
        return await getAllMenuItems();
      },
      
      (menus, fromCache) => {
        setAllMenus(menus || []);
      },
      
      (freshMenus) => {
        setAllMenus(freshMenus || []);
      },
      
      null
    );
  }
  },[settings])
  
  const applyFiltersToRestaurants = (restaurants) => {
    let filtered = [...restaurants]
    
    const isDefaultState = !appliedFilters ||
      (appliedFilters.sort === null &&
       appliedFilters.maxDeliveryFee === 15 &&
       appliedFilters.priceRange.length === 0 &&
       appliedFilters.cuisine.length === 0 &&
       appliedFilters.features.length === 0)

    if (isDefaultState) {
      return restaurants
    }
    
    if (appliedFilters.maxDeliveryFee && appliedFilters.maxDeliveryFee < 15) {
      filtered = filtered.filter(restaurant => {
        
        let deliveryFee = 2.5 

        if (restaurant.deliveryOptions) {
          const options = restaurant.deliveryOptions
          deliveryFee = options.fixedFee || 0
          
          if (restaurant.distance && options.distanceFee) {
            const baseDistanceFee = parseFloat(options.distanceFee.base) || 0
            const perKmFee = parseFloat(options.distanceFee.perKm) || 0
            deliveryFee += baseDistanceFee + (restaurant.distance * perKmFee)
          }
          
          if (options.isFreeDelivery && options.isFreeDelivery.enabled) {
            deliveryFee = 0
          }
        }

        return deliveryFee <= appliedFilters.maxDeliveryFee
      })
    }
    
    if (appliedFilters.priceRange && appliedFilters.priceRange.length > 0) {
      filtered = filtered.filter(restaurant => {
        const priceString = restaurant.price || '$' 
        const priceLevel = priceString.length 
        const priceLabels = {budget: 1, moderate: 2, expensive: 3, luxury: 4}
        return appliedFilters.priceRange.some(range => priceLabels[range] === priceLevel)
      })
    }
    
    if (appliedFilters.cuisine && appliedFilters.cuisine.length > 0) {
      filtered = filtered.filter(restaurant => {
        const restaurantCategories = restaurant.categories || []
        return appliedFilters.cuisine.some(cuisine => {
          
          return restaurantCategories.some(cat => {
            const title = cat.title?.toLowerCase()

            switch (cuisine) {
              case 'italian':
                return title === 'italian' || title === 'pizza' || title === 'mediterranean'
              case 'american':
                return title === 'american' || title === 'fast food'
              case 'asian':
                return title === 'asian'
              case 'french':
                return title === 'french'
              case 'vegetarian':
                return title?.includes('vegetarian')
              case 'bar':
                return title?.includes('bar') || title?.includes('wine')
              default:
                return title?.includes(cuisine)
            }
          })
        })
      })
    }
    
    if (appliedFilters.features && appliedFilters.features.length > 0) {
      filtered = filtered.filter(restaurant => {
        return appliedFilters.features.every(feature => {
          switch (feature) {
            case 'free_delivery':
              
              if (restaurant.deliveryOptions?.isFreeDelivery?.enabled) {
                return true
              }
              
              return restaurant.distance ? restaurant.distance < 2 : false

            case 'open_now':
              
              return restaurant.is_closed !== true

            case 'special_offers':
              
              return allPromotions?.some(promotion =>
                promotion.scope === 'restaurant' &&
                promotion.isActive &&
                new Date() >= new Date(promotion.startDate) &&
                new Date() <= new Date(promotion.endDate) &&
                promotion.applicableRestaurants?.some(restId =>
                  restId.toString() === restaurant._id ||
                  restId.toString() === restaurant.id ||
                  restId.toString() === restaurant.restaurantId
                )
              ) || false

            case 'new_restaurant':
              
              return restaurant.createdAt ?
                (new Date() - new Date(restaurant.createdAt)) < (30 * 24 * 60 * 60 * 1000) :
                false

            default:
              return true
          }
        })
      })
    }

    return filtered
  }
  
  const sortRestaurants = (restaurants) => {
    
    const isDefaultState = !appliedFilters ||
      (appliedFilters.sort === null &&
       appliedFilters.maxDeliveryFee === 15 &&
       appliedFilters.priceRange.length === 0 &&
       appliedFilters.cuisine.length === 0 &&
       appliedFilters.features.length === 0)

    if (isDefaultState || !appliedFilters?.sort) {
      return restaurants
    }

    const sorted = [...restaurants]

    if (appliedFilters.sort === 'popular') {
      return sorted.sort((a, b) => {
        const aCount = parseInt(a.review_count) || 0
        const bCount = parseInt(b.review_count) || 0
        return bCount - aCount  
      })
    }

    if (appliedFilters.sort === 'rating') {
      return sorted.sort((a, b) => {
        const aRating = parseFloat(a.rating) || 0
        const bRating = parseFloat(b.rating) || 0
        return bRating - aRating  
      })
    }

    if (appliedFilters.sort === 'delivery') {
      return sorted.sort((a, b) => {
        
        const prepTimeA = parseInt(a.collectTime) || 25
        const prepTimeB = parseInt(b.collectTime) || 25
        
        let totalTimeA = prepTimeA
        let totalTimeB = prepTimeB

        if (a.distance && a.distance > 0) {
          const travelTimeA = (a.distance / 45) * 60 
          totalTimeA += travelTimeA
        }

        if (b.distance && b.distance > 0) {
          const travelTimeB = (b.distance / 45) * 60 
          totalTimeB += travelTimeB
        }

        return totalTimeA - totalTimeB  
      })
    }

    if (appliedFilters.sort === 'deals') {
      return sorted.sort((a, b) => {
        
        const aPromotionCount = allPromotions?.filter(promotion =>
          promotion.scope === 'restaurant' && 
          promotion.isActive &&
          new Date() >= new Date(promotion.startDate) &&
          new Date() <= new Date(promotion.endDate) &&
          promotion.applicableRestaurants?.some(restId =>
            restId.toString() === a._id ||
            restId.toString() === a.id ||
            restId.toString() === a.restaurantId
          )
        ).length || 0

        const bPromotionCount = allPromotions?.filter(promotion =>
          promotion.scope === 'restaurant' && 
          promotion.isActive &&
          new Date() >= new Date(promotion.startDate) &&
          new Date() <= new Date(promotion.endDate) &&
          promotion.applicableRestaurants?.some(restId =>
            restId.toString() === b._id ||
            restId.toString() === b.id ||
            restId.toString() === b.restaurantId
          )
        ).length || 0
        
        return bPromotionCount - aPromotionCount
      })
    }

    return restaurants
  }

  const handleApplyFilters = (filters) => {
    setAppliedFilters(filters)
  }
  
  const restaurantsWithDistance = React.useMemo(() => {
    if (!restaurantData) return []
  
    return restaurantData.map((restaurant) => ({
      ...restaurant,
      distance: getDistanceKmBetweenUserAndRestaurant(restaurant, userLocation),
    }))
  }, [restaurantData, userLocation])  

  const createDynamicSections = React.useMemo(() => {
    if (!restaurantData || restaurantData.length === 0) return []
    
    // const restaurantsWithDistance = restaurantData.map(restaurant => {
    //   const distance = userLocation?.lat && userLocation?.lng && restaurant.latitude && restaurant.longitude ?
    //     getDistanceFromLatLonInKm(
    //       userLocation.lat, userLocation.lng,
    //       parseFloat(restaurant.latitude), parseFloat(restaurant.longitude)
    //     ) : null

    //   return {
    //     ...restaurant,
    //     distance
    //   }
    // })
    
    const filteredData = appliedFilters ? applyFiltersToRestaurants(restaurantsWithDistance) : restaurantsWithDistance
    const sortedData = appliedFilters ? sortRestaurants(filteredData) : filteredData

    const sections = []
    
    const restaurantsWithPromotions = sortedData.filter(restaurant => {
      const restaurantId = restaurant._id || restaurant.id || restaurant.restaurantId
      return allPromotions?.some(promotion =>
        promotion.scope === 'restaurant' &&
        promotion.isActive &&
        new Date() >= new Date(promotion.startDate) &&
        new Date() <= new Date(promotion.endDate) &&
        promotion.applicableRestaurants?.some(restId =>
          restId.toString() === restaurantId.toString()
        )
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
    
    let topRated = sortedData
      .filter(restaurant => restaurant.rating && parseFloat(restaurant.rating) >= 4.5)
    
    if (!appliedFilters?.sort) {
      topRated = topRated.sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0))
    }

    if (topRated.length >= 2) {
      sections.push({
        id: 'top_rated',
        title: i18n.t('home.sections.topRated'),
        icon: 'star',
        restaurants: topRated.slice(0, 8),
        type: 'rating'
      })
    }
    
    let quickCuisine = sortedData
      .filter(restaurant => restaurant.collectTime && parseInt(restaurant.collectTime) <= 25)
    
    if (!appliedFilters?.sort) {
      quickCuisine = quickCuisine.sort((a, b) => parseInt(a.collectTime || 0) - parseInt(b.collectTime || 0))
    }

    if (quickCuisine.length >= 2) {
      sections.push({
        id: 'quick_cuisine',
        title: i18n.t('home.sections.quickCuisine'),
        icon: 'flash',
        restaurants: quickCuisine.slice(0, 8),
        type: 'cuisine'
      })
    }
    
    let expressPickup = sortedData
      .filter(restaurant => restaurant.collectTime && parseInt(restaurant.collectTime) <= 20)
    
    if (!appliedFilters?.sort) {
      expressPickup = expressPickup.sort((a, b) => parseInt(a.collectTime || 0) - parseInt(b.collectTime || 0))
    }

    if (expressPickup.length >= 2) {
      sections.push({
        id: 'express_pickup',
        title: i18n.t('home.sections.expressPickup'),
        icon: 'run',
        restaurants: expressPickup.slice(0, 8),
        type: 'pickup'
      })
    }
    
    let mostPopular = sortedData
      .filter(restaurant => restaurant.review_count && parseInt(restaurant.review_count) > 150)
    
    if (!appliedFilters?.sort) {
      mostPopular = mostPopular.sort((a, b) => parseInt(b.review_count || 0) - parseInt(a.review_count || 0))
    }

    if (mostPopular.length >= 2) {
      sections.push({
        id: 'most_popular',
        title: i18n.t('home.sections.mostPopular'),
        icon: 'trending-up',
        restaurants: mostPopular.slice(0, 8),
        type: 'popular'
      })
    }
    
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
  }, [restaurantData, allPromotions, appliedFilters, userLocation])
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
        <SearchBar cityHandler={setCity} navigation={navigation} restaurantData={restaurantsWithDistance} searchbar={searchbar}/>
      </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {}
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
                    
                    navigation.navigate('SearchFlow', {
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
 