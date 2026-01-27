import { View, Text, SafeAreaView, StatusBar, ScrollView, StyleSheet, Platform, TouchableOpacity} from 'react-native'
import React, {useState, useEffect, useRef, useContext} from 'react'
import { Icon } from 'react-native-elements'
import i18n from '../i18n'
import HeaderTabs from '../components/home/HeaderTabs'
import SearchBar from '../components/home/SearchBar'
import RestaurantItems, { localRestaurants } from '../components/home/RestaurantItems'
import { Divider } from 'react-native-elements'
import { colors, getDistanceFromLatLonInKm } from '../global'
// Données backend seulement - plus de données statiques
import HomeHeader from '../components/home/HomeHeader'
import { getRestaurantsFromFirebase, getAllPromotions, getAllMenuItems } from '../api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { loadRestaurantsWithSmartCache, loadPromotionsWithSmartCache, loadMenusWithSmartCache } from '../utils/cacheUtils'
import { AntDesign } from '@expo/vector-icons'
import Loader from './Loader'
import { RestaurantsContext } from '../contexts/RestaurantsContext'
import * as Location from 'expo-location'

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
  // Récupérer la position utilisateur
  const getUserLocation = async () => {
    try {
      console.log('📍 Home - Tentative de récupération de la position utilisateur...')

      // D'abord essayer depuis AsyncStorage (comme dans RestaurantsMapScreen)
      const userData = await AsyncStorage.getItem('userData')
      if (userData) {
        const user = JSON.parse(userData)
        if (user.location && user.location.latitude && user.location.longitude) {
          const location = {
            lat: user.location.latitude,
            lng: user.location.longitude
          }
          console.log('✅ Home - Position trouvée dans AsyncStorage:', location)
          setUserLocation(location)
          return
        }
      }

      // Si pas de coordonnées utilisateur, demander géolocalisation
      console.log('📍 Home - Pas de position dans AsyncStorage, demande de géolocalisation...')
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        console.log('❌ Home - Permission de géolocalisation refusée')
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      })

      const userPos = {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      }

      console.log('✅ Home - Position obtenue par géolocalisation:', userPos)
      setUserLocation(userPos)

    } catch (error) {
      console.error('❌ Home - Erreur lors de la récupération de la position:', error)
    }
  }

  useEffect(()=>{
    // Charger la position utilisateur
    getUserLocation()

    // Charger les restaurants avec cache intelligent
    loadRestaurantsWithSmartCache(
      // Fonction API fetcher
      async () => {
        console.log('🌐 Fetching restaurants from API');
        return await getRestaurantsFromFirebase();
      },
      // Callback quand les données sont prêtes (cache ou API)
      (restaurants, fromCache) => {
        setRestaurantData(restaurants);

        if (fromCache) {
          console.log('⚡ Restaurants affichés depuis le cache');
        } else {
          console.log('📡 Restaurants affichés depuis l\'API');
        }
      },
      // Callback quand les données sont mises à jour depuis l'API
      (freshRestaurants) => {
        console.log('🔄 Restaurants mis à jour depuis l\'API');
        setRestaurantData(freshRestaurants);
      },
      // Callback pour l'état de chargement
      null
    );

    // Charger les promotions avec cache intelligent
    loadPromotionsWithSmartCache(
      // Fonction API fetcher
      async () => {
        console.log('🌐 Fetching promotions from API');
        return await getAllPromotions();
      },
      // Callback quand les données sont prêtes (cache ou API)
      (promotions, fromCache) => {
        setAllPromotions(promotions || []);

        if (fromCache) {
          console.log('⚡ Promotions affichées depuis le cache');
        } else {
          console.log('📡 Promotions affichées depuis l\'API');
        }
      },
      // Callback quand les données sont mises à jour depuis l'API
      (freshPromotions) => {
        console.log('🔄 Promotions mises à jour depuis l\'API');
        setAllPromotions(freshPromotions || []);
      },
      // Callback pour l'état de chargement
      null
    );

    // Charger les menus avec cache intelligent
    loadMenusWithSmartCache(
      // Fonction API fetcher
      async () => {
        console.log('🌐 Fetching menus from API');
        return await getAllMenuItems();
      },
      // Callback quand les données sont prêtes (cache ou API)
      (menus, fromCache) => {
        setAllMenus(menus || []);

        if (fromCache) {
          console.log('⚡ Menus affichés depuis le cache');
        } else {
          console.log('📡 Menus affichés depuis l\'API');
        }
      },
      // Callback quand les données sont mises à jour depuis l'API
      (freshMenus) => {
        console.log('🔄 Menus mis à jour depuis l\'API');
        setAllMenus(freshMenus || []);
      },
      // Callback pour l'état de chargement
      null
    );
  },[])

  // Fonction pour appliquer les filtres aux restaurants
  const applyFiltersToRestaurants = (restaurants) => {
    let filtered = [...restaurants]

    // Vérifier si c'est l'état par défaut (aucun filtre appliqué)
    const isDefaultState = !appliedFilters ||
      (appliedFilters.sort === null &&
       appliedFilters.maxDeliveryFee === 15 &&
       appliedFilters.priceRange.length === 0 &&
       appliedFilters.cuisine.length === 0 &&
       appliedFilters.features.length === 0)

    if (isDefaultState) {
      console.log('🔄 État par défaut détecté - aucun filtrage appliqué')
      return restaurants
    }

    // Filtre par frais de livraison maximum
    if (appliedFilters.maxDeliveryFee && appliedFilters.maxDeliveryFee < 15) {
      filtered = filtered.filter(restaurant => {
        // Utiliser les vraies données deliveryOptions de la DB
        let deliveryFee = 2.5 // Frais par défaut si pas de deliveryOptions

        if (restaurant.deliveryOptions) {
          const options = restaurant.deliveryOptions
          deliveryFee = options.fixedFee || 0

          // Ajouter les frais de distance si disponible
          if (restaurant.distance && options.distanceFee) {
            const baseDistanceFee = parseFloat(options.distanceFee.base) || 0
            const perKmFee = parseFloat(options.distanceFee.perKm) || 0
            deliveryFee += baseDistanceFee + (restaurant.distance * perKmFee)
          }

          // Vérifier livraison gratuite
          if (options.isFreeDelivery && options.isFreeDelivery.enabled) {
            deliveryFee = 0
          }
        }

        return deliveryFee <= appliedFilters.maxDeliveryFee
      })
    }

    // Filtre par gamme de prix
    if (appliedFilters.priceRange && appliedFilters.priceRange.length > 0) {
      filtered = filtered.filter(restaurant => {
        const priceString = restaurant.price || '$' // Valeur par défaut
        const priceLevel = priceString.length // $ = 1, $$ = 2, $$$ = 3, $$$$ = 4
        const priceLabels = {budget: 1, moderate: 2, expensive: 3, luxury: 4}
        return appliedFilters.priceRange.some(range => priceLabels[range] === priceLevel)
      })
    }

    // Filtre par type de cuisine
    if (appliedFilters.cuisine && appliedFilters.cuisine.length > 0) {
      filtered = filtered.filter(restaurant => {
        const restaurantCategories = restaurant.categories || []
        return appliedFilters.cuisine.some(cuisine => {
          // Logique spéciale pour chaque type de cuisine
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

    // Filtre par fonctionnalités
    if (appliedFilters.features && appliedFilters.features.length > 0) {
      filtered = filtered.filter(restaurant => {
        return appliedFilters.features.every(feature => {
          switch (feature) {
            case 'free_delivery':
              // Livraison gratuite : frais = 0 OU distance < 2km (livraison locale gratuite)
              if (restaurant.deliveryOptions?.isFreeDelivery?.enabled) {
                return true
              }
              // Simulation : livraison gratuite pour restaurants très proches
              return restaurant.distance ? restaurant.distance < 2 : false

            case 'open_now':
              // Restaurant ouvert : is_closed = false
              return restaurant.is_closed !== true

            case 'special_offers':
              // Offres spéciales : promotions actives pour ce restaurant
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
              // Nouveau restaurant : créé il y a moins de 30 jours
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

  // Fonction pour trier les restaurants
  const sortRestaurants = (restaurants) => {
    // Vérifier si c'est l'état par défaut
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
        return bCount - aCount  // Tri décroissant : plus d'avis = mieux
      })
    }

    if (appliedFilters.sort === 'rating') {
      return sorted.sort((a, b) => {
        const aRating = parseFloat(a.rating) || 0
        const bRating = parseFloat(b.rating) || 0
        return bRating - aRating  // Tri décroissant : meilleur rating = mieux
      })
    }

    if (appliedFilters.sort === 'delivery') {
      return sorted.sort((a, b) => {
        // Calcul du delivery time total pour chaque restaurant
        const prepTimeA = parseInt(a.collectTime) || 25
        const prepTimeB = parseInt(b.collectTime) || 25

        // Si on a la distance, calculer le temps de trajet
        let totalTimeA = prepTimeA
        let totalTimeB = prepTimeB

        if (a.distance && a.distance > 0) {
          const travelTimeA = (a.distance / 45) * 60 // 45 km/h
          totalTimeA += travelTimeA
        }

        if (b.distance && b.distance > 0) {
          const travelTimeB = (b.distance / 45) * 60 // 45 km/h
          totalTimeB += travelTimeB
        }

        return totalTimeA - totalTimeB  // Tri croissant : plus petit temps total = mieux
      })
    }

    if (appliedFilters.sort === 'deals') {
      return sorted.sort((a, b) => {
        // Compter les promotions actives pour chaque restaurant
        const aPromotionCount = allPromotions?.filter(promotion =>
          promotion.scope === 'restaurant' && // Uniquement les promos restaurant
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
          promotion.scope === 'restaurant' && // Uniquement les promos restaurant
          promotion.isActive &&
          new Date() >= new Date(promotion.startDate) &&
          new Date() <= new Date(promotion.endDate) &&
          promotion.applicableRestaurants?.some(restId =>
            restId.toString() === b._id ||
            restId.toString() === b.id ||
            restId.toString() === b.restaurantId
          )
        ).length || 0

        // Tri décroissant : plus de promotions = mieux
        return bPromotionCount - aPromotionCount
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

    // Ajouter la distance calculée à chaque restaurant
    const restaurantsWithDistance = restaurantData.map(restaurant => {
      const distance = userLocation?.lat && userLocation?.lng && restaurant.latitude && restaurant.longitude ?
        getDistanceFromLatLonInKm(
          userLocation.lat, userLocation.lng,
          parseFloat(restaurant.latitude), parseFloat(restaurant.longitude)
        ) : null


      return {
        ...restaurant,
        distance
      }
    })

    // Appliquer les filtres aux données
    const filteredData = appliedFilters ? applyFiltersToRestaurants(restaurantsWithDistance) : restaurantsWithDistance
    const sortedData = appliedFilters ? sortRestaurants(filteredData) : filteredData

    const sections = []

    // 1. Section "Offres spéciales" - Restaurants avec promotions actives du backend
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

    // 2. Section "Les mieux notés" - Restaurants avec rating >= 4.5
    let topRated = sortedData
      .filter(restaurant => restaurant.rating && parseFloat(restaurant.rating) >= 4.5)

    // Ne trier que si aucun tri global n'est appliqué
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

    // 3. Section "Cuisine rapide" - Restaurants avec collectTime <= 25 min (moyenne 29min)
    let quickCuisine = sortedData
      .filter(restaurant => restaurant.collectTime && parseInt(restaurant.collectTime) <= 25)

    // Ne trier que si aucun tri global n'est appliqué
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

    // 4. Section "À emporter express" - Restaurants avec collectTime <= 20 min
    let expressPickup = sortedData
      .filter(restaurant => restaurant.collectTime && parseInt(restaurant.collectTime) <= 20)

    // Ne trier que si aucun tri global n'est appliqué
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

    // 5. Section "Les plus populaires" - Restaurants avec le plus d'avis (> 150 avis)
    let mostPopular = sortedData
      .filter(restaurant => restaurant.review_count && parseInt(restaurant.review_count) > 150)

    // Ne trier que si aucun tri global n'est appliqué
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
 