import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar} from 'react-native'
import React, { useEffect, useState } from 'react'
 import { getRestaurantsFromFirebase, searchRestaurantsByCategory } from '../api'
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

  useEffect(()=>{
    const { categoryId, name, type } = route.params

    // Réinitialiser les états
    setLoader(true)
    setError(null)
    setRestaurantData([])

    // Fonction de chargement des données
    const loadData = async () => {
      try {
        let restaurantsResult = []

        // Si on a un categoryId, c'est une recherche par catégorie
        if (categoryId) {
          restaurantsResult = await searchRestaurantsByCategory(categoryId)
        }
        // Si c'est une recherche "Top rated" spéciale
        else if (name === 'TOP_RATED_SPECIAL') {
          const allRestaurants = await getRestaurantsFromFirebase()
          // Trier par rating décroissant (les mieux notés en premier)
          restaurantsResult = allRestaurants
            .filter(restaurant => restaurant.rating) // Uniquement ceux qui ont un rating
            .sort((a, b) => (b.rating || 0) - (a.rating || 0)) // Tri décroissant
        }
        // Si c'est une recherche "Near me" par géolocalisation
        else if (name === 'NEAR_ME_SPECIAL') {
          // Demander la permission de géolocalisation
          const { status } = await Location.requestForegroundPermissionsAsync()
          if (status !== 'granted') {
            throw new Error('Location permission denied')
          }

          // Récupérer la position actuelle
          const userLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High
          })

          const userLat = userLocation.coords.latitude
          const userLon = userLocation.coords.longitude

          // Récupérer tous les restaurants
          const allRestaurants = await getRestaurantsFromFirebase()

          // Calculer les distances et filtrer/trier
          restaurantsResult = allRestaurants
            .filter(restaurant => restaurant.lat && restaurant.lng) // Uniquement ceux avec coordonnées
            .map(restaurant => ({
              ...restaurant,
              distance: getDistanceFromLatLonInKm(
                userLat, userLon,
                restaurant.lat, restaurant.lng
              )
            }))
            .filter(restaurant => restaurant.distance <= 10) // Rayon de 10km
            .sort((a, b) => a.distance - b.distance) // Tri par distance croissante
        }
        // Cas spécial pour afficher tous les restaurants (promotions platform)
        else if (name === 'ALL_RESTAURANTS') {
          restaurantsResult = await getRestaurantsFromFirebase()
        }
        // Sinon c'est une recherche textuelle normale
        else if (name) {
          const allRestaurants = await getRestaurantsFromFirebase()
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
          restaurantsResult = await getRestaurantsFromFirebase()
        }

        setRestaurantData(restaurantsResult || [])
      } catch (err) {
        console.error('Error loading search results:', err)

        // Gestion spécifique des erreurs de géolocalisation
        if (name === 'NEAR_ME_SPECIAL' && err.message === 'Location permission denied') {
          setError(i18n.t('search.locationPermissionDenied'))
          // Charger quand même tous les restaurants
          const allRestaurants = await getRestaurantsFromFirebase()
          setRestaurantData(allRestaurants)
        } else if (name === 'NEAR_ME_SPECIAL') {
          setError(i18n.t('search.locationError'))
          // Charger quand même tous les restaurants
          const allRestaurants = await getRestaurantsFromFirebase()
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
    } else if (name === 'NEAR_ME_SPECIAL') {
      title = i18n.t ? i18n.t('search.nearMe') : 'Near Me'
      displayQuery = title
    } else if (name === 'ALL_RESTAURANTS') {
      title = i18n.t ? i18n.t('search.allRestaurants') : 'All Restaurants'
      displayQuery = title
    } else if (name) {
      title = name
      displayQuery = name
    }

    setSearchQuery(displayQuery)
    navigation.setOptions({title})

  }, [route.params])

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
      {/* Ici on pourrait ajouter des boutons de tri/filtre à l'avenir */}
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
              onPress={() => navigation.navigate("RestaurantDetail", { restaurant: item })}
              style={styles.itemContainer}
              activeOpacity={0.7}
            >
              <RestaurantImage image={item.image} />
              <RestaurantInfo
                name={item.name}
                rating={item.rating}
                city={item.city}
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
})