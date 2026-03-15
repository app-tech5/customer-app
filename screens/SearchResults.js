import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar} from 'react-native'
import React, { useEffect, useState } from 'react'
 import { getRestaurants, searchRestaurantsByCategory, getFavorites } from '../api'
import { categories } from '../data'
import {RestaurantImage, RestaurantInfo} from '../components/home/RestaurantItems'
import Loader from './Loader'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n from '../i18n'
import { colors, location, getDistanceFromLatLonInKm } from '../global'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import * as Location from 'expo-location'

export default function SearchResults({route, navigation}) {
  const [restaurantData, setRestaurantData] = useState([])
  const [loader, setLoader] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cameFromOffers, setCameFromOffers] = useState(false)
  const [displayMode, setDisplayMode] = useState('restaurants')
  const [distanceFilter, setDistanceFilter] = useState(10) // Rayon par défaut en km

  useEffect(()=>{
    const { categoryId, categoryName, name, type, fromOffers, fromCategoryResults, categoryResultsParams, applicableRestaurants, promotionScope, searchTerm, restaurantData: prefilteredData, totalResults } = route.params

    // Vérifier si on vient de l'écran Offers
    setCameFromOffers(fromOffers === true)

    // Réinitialiser les états
    setLoader(true)
    setError(null)
    setRestaurantData([])

    // Fonction de chargement des données
    const loadData = async () => {
      try {
        let restaurantsResult = []

        // Cas spécial : promotion restaurant avec restaurants spécifiques
        if (promotionScope === 'restaurant' && applicableRestaurants && applicableRestaurants.length > 0) {
          console.log('🏪 Loading specific restaurants for promotion - IDs reçus:', applicableRestaurants)

          // Récupérer tous les restaurants
          const allRestaurants = await getRestaurants()

          // Log pour comparer les IDs
          console.log('📋 IDs de tous les restaurants en DB:', allRestaurants.map(r => r._id || r.restaurantId))
          console.log('🔍 IDs recherchés dans applicableRestaurants:', applicableRestaurants)

          // Filtrer seulement les restaurants applicables à la promotion
          restaurantsResult = allRestaurants.filter(restaurant => {
            const restaurantId = restaurant._id || restaurant.restaurantId
            return applicableRestaurants.some(promoRestId => {
              const promoId = typeof promoRestId === 'object' ? promoRestId.toString() : promoRestId
              const restIdStr = restaurantId ? restaurantId.toString() : ''
              return promoId === restIdStr
            })
          })

          console.log('✅ Found', restaurantsResult.length, 'restaurants for promotion')
          console.log('🏪 Restaurants filtrés:', restaurantsResult.map(r => ({ id: r._id, name: r.name })))

          console.log('📱 Setting restaurant data - Count:', restaurantsResult.length, 'Mode: restaurants')
          setRestaurantData(restaurantsResult)
          setDisplayMode('restaurants')
          return // ← SORTIR DE LA FONCTION APRÈS LE FILTRAGE
        }
        // Si on a un categoryId (legacy) ou categoryAlias, c'est une recherche par catégorie
        // if (categoryId) {
        //   console.log('🔍 Recherche par catégorie:', categoryId)
        //   restaurantsResult = await searchRestaurantsByCategory(categoryId)
        // } else 
        if (categoryName) {
          restaurantsResult = await searchRestaurantsByCategory(categoryName)
        }
        // Si c'est une recherche "Top rated" spéciale
        else if (name === 'TOP_RATED_SPECIAL') {
          const allRestaurants = await getRestaurants()
          // Trier par rating décroissant (les mieux notés en premier)
          restaurantsResult = allRestaurants
            .filter(restaurant => restaurant.rating) // Uniquement ceux qui ont un rating
            .sort((a, b) => (b.rating || 0) - (a.rating || 0)) // Tri décroissant
        }
        // Si c'est une recherche "Favorites" spéciale
        else if (name === 'FAVORITES_SPECIAL') {
          const favoritesResponse = await getFavorites()
          if (favoritesResponse.success && favoritesResponse.favorites) {
            // Récupérer tous les restaurants pour matcher avec les favoris
            const allRestaurants = await getRestaurants()
            const favoriteIds = favoritesResponse.favorites.map(fav => fav._id || fav.id)

            // Filtrer seulement les restaurants favoris
            restaurantsResult = allRestaurants.filter(restaurant =>
              favoriteIds.includes(restaurant._id || restaurant.id)
            )
          } else {
            restaurantsResult = [] // Aucun favori trouvé
          }
        }
        // Si c'est une recherche "Near me" par géolocalisation
        else if (name === 'NEAR_ME_SPECIAL') {
          let userLat, userLon;

          // D'abord essayer de récupérer les coordonnées depuis les données utilisateur
          try {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
              const user = JSON.parse(userData);
              if (user.location && user.location.latitude && user.location.longitude) {
                userLat = user.location.latitude;
                userLon = user.location.longitude;
                console.log('📍 Utilisation des coordonnées utilisateur:', userLat, userLon);
              }
            }
          } catch (error) {
            console.log('Erreur récupération coordonnées utilisateur:', error);
          }

          // Si pas de coordonnées utilisateur, demander la géolocalisation
          if (!userLat || !userLon) {
            console.log('📍 Aucune coordonnée utilisateur, demande géolocalisation...');
            const { status } = await Location.requestForegroundPermissionsAsync()
            if (status !== 'granted') {
              throw new Error('Location permission denied')
            }

            const userLocation = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High
            })

            userLat = userLocation.coords.latitude
            userLon = userLocation.coords.longitude
          }

          // Récupérer tous les restaurants
          const allRestaurants = await getRestaurants()
          console.log(`🏪 ${allRestaurants.length} restaurants récupérés`);

          // Calculer les distances et filtrer/trier
          restaurantsResult = allRestaurants
            .filter(restaurant => restaurant.latitude && restaurant.longitude) // Uniquement ceux avec coordonnées
            .map(restaurant => ({
              ...restaurant,
              distance: getDistanceFromLatLonInKm(
                userLat, userLon,
                restaurant.latitude, restaurant.longitude
              )
            }))
            .filter(restaurant => restaurant.distance <= distanceFilter) // Rayon configurable
            .sort((a, b) => a.distance - b.distance) // Tri par distance croissante
        }
        // Cas spécial pour afficher tous les restaurants (promotions platform)
        else if (name === 'ALL_RESTAURANTS') {
          restaurantsResult = await getRestaurants()
        }
        // Cas spécial : données préfiltrées depuis SearchBar
        else if (prefilteredData && Array.isArray(prefilteredData)) {
          console.log('🔍 Using prefiltered data from SearchBar - Count:', prefilteredData.length)
          restaurantsResult = prefilteredData
        }
        // Sinon c'est une recherche textuelle normale
        else if (name) {
          const allRestaurants = await getRestaurants()
          // Filtrage simple côté client (temporaire)
          const filtered = allRestaurants.filter(restaurant =>
            restaurant.name?.toLowerCase().includes(name.toLowerCase()) ||
            restaurant.description?.toLowerCase().includes(name.toLowerCase()) ||
            restaurant.city?.toLowerCase().includes(name.toLowerCase())
          )
          restaurantsResult = filtered.length > 0 ? filtered : allRestaurants
        }
        // Si aucun name fourni, on pourrait afficher tous les restaurants ou rien
        else {
          // Pour l'instant, afficher tous les restaurants par défaut
          restaurantsResult = await getRestaurants()
        }

        console.log('📱 Setting restaurant data - Count:', restaurantsResult?.length || 0, 'Mode: restaurants')
        setRestaurantData(restaurantsResult || [])
      } catch (err) {
        console.error('Error loading search results:', err)

        // Gestion spécifique des erreurs de géolocalisation
        if (name === 'NEAR_ME_SPECIAL' && err.message === 'Location permission denied') {
          setError(i18n.t('search.locationPermissionDenied'))
          // Charger quand même tous les restaurants
          const allRestaurants = await getRestaurants()
          console.log('📱 Setting restaurant data (location denied) - Count:', allRestaurants?.length || 0)
          setRestaurantData(allRestaurants)
        } else if (name === 'NEAR_ME_SPECIAL') {
          setError(i18n.t('search.locationError'))
          // Charger quand même tous les restaurants
          const allRestaurants = await getRestaurants()
          console.log('📱 Setting restaurant data (location denied) - Count:', allRestaurants?.length || 0)
          setRestaurantData(allRestaurants)
        } else {
          setError(i18n.t('search.errorSubtitle'))
          setRestaurantData([])
        }
      } finally {
        setTimeout(() => setLoader(false), 800) // Délai minimum pour UX
      }
    }

    loadData()

    // Définir le titre selon le type de recherche
    let title = i18n.t ? i18n.t('search.results') : 'Search Results'
    let displayQuery = ''

    if (name === 'TOP_RATED_SPECIAL') {
      title = i18n.t ? i18n.t('search.topRated') : 'Top Rated'
      displayQuery = title
    } else if (name === 'FAVORITES_SPECIAL') {
      title = i18n.t ? i18n.t('search.favorites') : 'My Favorites'
      displayQuery = title
    } else if (name === 'NEAR_ME_SPECIAL') {
      title = i18n.t ? i18n.t('search.nearMe') : 'Near Me'
      displayQuery = title
    } else if (name === 'ALL_RESTAURANTS') {
      title = i18n.t ? i18n.t('search.allRestaurants') : 'All Restaurants'
      displayQuery = title
    } else if (categoryName) {
      title = categoryName
      displayQuery = categoryName
    } else if (searchTerm) {
      title = `"${searchTerm}"`
      displayQuery = searchTerm
    } else if (name) {
      title = name
      displayQuery = name
    }

    setSearchQuery(displayQuery)
    // Configurer le header avec bouton back personnalisé
    navigation.setOptions({
      title,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            if (cameFromOffers) {
              // Si on vient de Offers, retourner à Offers
              navigation.navigate('Offers')
            } else if (fromCategoryResults) {
              // Si on vient de CategoryResults, retourner à CategoryResults
              navigation.navigate('CategoryResults', route.params?.categoryResultsParams || {})
            } else {
              // Sinon, comportement normal
              navigation.goBack()
            }
          }}
          style={{ padding: 10, marginLeft: 5 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      )
    })

  }, [route.params, cameFromOffers])

  // Recharger les données quand le filtre de distance change (pour Near Me seulement)
  useEffect(() => {
    if (route.params?.name === 'NEAR_ME_SPECIAL') {
      const reloadData = async () => {
        setLoader(true)
        setError(null)
        try {
          // Récupérer la position utilisateur (depuis AsyncStorage ou géolocalisation)
          let userLat, userLon;

          const userData = await AsyncStorage.getItem('userData');
          if (userData) {
            const user = JSON.parse(userData);
            if (user.location && user.location.latitude && user.location.longitude) {
              userLat = user.location.latitude;
              userLon = user.location.longitude;
            }
          }

          if (!userLat || !userLon) {
            const { status } = await Location.requestForegroundPermissionsAsync()
            if (status !== 'granted') {
              throw new Error('Location permission denied')
            }
            const userLocation = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High
            })
            userLat = userLocation.coords.latitude
            userLon = userLocation.coords.longitude
          }

          const allRestaurants = await getRestaurants()

          const filteredRestaurants = allRestaurants
            .filter(restaurant => restaurant.latitude && restaurant.longitude)
            .map(restaurant => ({
              ...restaurant,
              distance: getDistanceFromLatLonInKm(
                userLat, userLon,
                restaurant.latitude, restaurant.longitude
              )
            }))
            .filter(restaurant => restaurant.distance <= distanceFilter)
            .sort((a, b) => a.distance - b.distance)

          setRestaurantData(filteredRestaurants)
        } catch (err) {
          console.error('Error reloading data with new distance filter:', err)
        } finally {
          setTimeout(() => setLoader(false), 800)
        }
      }

      reloadData()
    }
  }, [distanceFilter])

  // Composant pour l'état vide
  const EmptyState = ({ query, isError }) => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={isError ? "alert-circle" : "search"}
        size={64}
        color={colors.grey[400]}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>
        {isError ? i18n.t('search.errorTitle') : i18n.t('search.noResultsTitle')}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isError
          ? i18n.t('search.errorSubtitle')
          : query
            ? `${i18n.t('search.noResults')} "${query}"`
            : i18n.t('search.noResultsSubtitle')
        }
      </Text>
      {!isError && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>{i18n.t('search.modifySearch')}</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  // Header avec compteur de résultats
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.resultInfo}>
        <Text style={styles.resultCount}>
          {restaurantData.length} {restaurantData.length === 1 ? i18n.t('search.result') : i18n.t('search.results')}
        </Text>
        {searchQuery && searchQuery !== 'TOP_RATED_SPECIAL' && searchQuery !== 'NEAR_ME_SPECIAL' && (
          <Text style={styles.resultQuery}>{i18n.t('search.resultsFor')} "{searchQuery}"</Text>
        )}
        {searchQuery === 'NEAR_ME_SPECIAL' && (
          <Text style={styles.resultQuery}>{i18n.t('search.nearby', 'nearby')}</Text>
        )}
      </View>

      {/* Contrôles spécifiques pour Near Me */}
      {route.params?.name === 'NEAR_ME_SPECIAL' && (
        <View style={styles.nearMeControls}>
          <Text style={styles.distanceLabel}>{i18n.t('search.distance', 'Distance')}:</Text>
          <View style={styles.distanceButtons}>
            {[5, 10, 15, 25].map(distance => (
              <TouchableOpacity
                key={distance}
                style={[
                  styles.distanceButton,
                  distanceFilter === distance && styles.distanceButtonActive
                ]}
                onPress={() => setDistanceFilter(distance)}
              >
                <Text style={[
                  styles.distanceButtonText,
                  distanceFilter === distance && styles.distanceButtonTextActive
                ]}>
                  {distance}km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  )

  if (loader) return <Loader />

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState query={searchQuery} isError={true} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      {restaurantData.length === 0 ? (
        <EmptyState query={searchQuery} isError={false} />
      ) : (
        <FlatList
          data={restaurantData}
          keyExtractor={(item, index) => String(index)}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() => {
                // Navigation vers RestaurantDetail depuis SearchNavigator
                // On navigue vers BottomTabs d'abord, puis vers HomeNavigator, puis RestaurantDetail
                navigation.navigate('BottomTabs', {
                  screen: 'Home',
                  params: {
                    screen: 'RestaurantDetail',
                    params: {
                      restaurant: item,
                      fromPromotion: cameFromOffers,
                      promotionName: route.params?.name || undefined
                    }
                  }
                });
              }}
              style={styles.itemContainer}
              activeOpacity={0.7}
            >
              <RestaurantImage image={item.image} />
              <RestaurantInfo
                name={item.name}
                rating={item.rating}
                city={item.city}
                distance={route.params?.name === 'NEAR_ME_SPECIAL' ? item.distance : undefined}
              />
            </TouchableOpacity>
          )}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32, // Espace supplémentaire en bas
  },
  header: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  resultInfo: {
    alignItems: 'center',
  },
  resultCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  resultQuery: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  itemContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
  nearMeControls: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  distanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  distanceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  distanceButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.secondary,
  },
  distanceButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  distanceButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.primary,
  },
  distanceButtonTextActive: {
    color: colors.text.white,
  },
})