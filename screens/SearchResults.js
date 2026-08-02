import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { RestaurantsContext } from '../contexts/RestaurantsContext'
import { getRestaurants, searchRestaurantsByCategory, getFavorites } from '../api'
import { RestaurantImage, RestaurantInfo } from '../components/home/RestaurantItems'
import Loader from './Loader'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n from '../lang/i18n'
import { colors } from '../global'
import { Ionicons } from '@expo/vector-icons'
import { navigateToRestaurantsMap } from '../navigation/navigationHelpers'
import * as Location from 'expo-location'

export default function SearchResults({ route, navigation }) {
  const { restaurantData: catalogRestaurants } = useContext(RestaurantsContext)
  const [restaurantData, setRestaurantData] = useState([])
  const [loader, setLoader] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cameFromOffers, setCameFromOffers] = useState(false)
  const [displayMode, setDisplayMode] = useState('restaurants')
  const [distanceFilter, setDistanceFilter] = useState(10)

  useEffect(() => {
    const { categoryId, categoryName, name, type, fromOffers, fromCategoryResults, categoryResultsParams, applicableRestaurants, promotionScope, searchTerm, restaurantData: listFromParams } = route.params

    setCameFromOffers(fromOffers === true)

    setLoader(true)
    setError(null)
    setRestaurantData([])

    const loadData = async () => {
      const baseRestaurants =
        catalogRestaurants?.length > 0
          ? catalogRestaurants
          : await getRestaurants()
      try {
        let restaurantsResult = []

        if (promotionScope === 'restaurant' && applicableRestaurants && applicableRestaurants.length > 0) {
          console.warn('🏪 Loading specific restaurants for promotion - IDs reçus:', applicableRestaurants)

          const allRestaurants = baseRestaurants

          console.warn('📋 IDs de tous les restaurants en DB:', allRestaurants.map(r => r._id || r.restaurantId))
          console.warn('🔍 IDs recherchés dans applicableRestaurants:', applicableRestaurants)

          restaurantsResult = allRestaurants.filter(restaurant => {
            const restaurantId = restaurant._id || restaurant.restaurantId
            return applicableRestaurants.some(promoRestId => {
              const promoId = typeof promoRestId === 'object' ? promoRestId.toString() : promoRestId
              const restIdStr = restaurantId ? restaurantId.toString() : ''
              return promoId === restIdStr
            })
          })

          console.warn('✅ Found', restaurantsResult.length, 'restaurants for promotion')
          console.warn('🏪 Restaurants filtrés:', restaurantsResult.map(r => ({ id: r._id, name: r.name })))

          console.warn('📱 Setting restaurant data - Count:', restaurantsResult.length, 'Mode: restaurants')
          setRestaurantData(restaurantsResult)
          setDisplayMode('restaurants')
          return
        }

        if (categoryName) {
          restaurantsResult = await searchRestaurantsByCategory(categoryName)
        }

        else if (categoryId) {
          restaurantsResult = await searchRestaurantsByCategory(categoryId)
        }

        else if (name === 'TOP_RATED_SPECIAL') {
          const allRestaurants = baseRestaurants

          restaurantsResult = allRestaurants
            .filter(restaurant => restaurant.rating)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        }

        else if (name === 'FAVORITES_SPECIAL') {
          const favoritesResponse = await getFavorites()
          if (favoritesResponse.success && favoritesResponse.favorites) {

            const favoriteIds = favoritesResponse.favorites.map(fav => fav._id || fav.id)

            restaurantsResult = baseRestaurants.filter(restaurant =>
              favoriteIds.includes(restaurant._id || restaurant.id)
            )
          } else {
            restaurantsResult = []
          }
        }

        else if (name === 'NEAR_ME_SPECIAL') {
          let userLat, userLon;

          try {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
              const user = JSON.parse(userData);
              if (user.location && user.location.latitude && user.location.longitude) {
                userLat = user.location.latitude;
                userLon = user.location.longitude;
                console.warn('📍 Utilisation des coordonnées utilisateur:', userLat, userLon);
              }
            }
          } catch (error) {
            console.error('Erreur récupération coordonnées utilisateur:', error);
          }

          if (!userLat || !userLon) {
            console.warn('📍 Aucune coordonnée utilisateur, demande géolocalisation...');
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

          restaurantsResult = baseRestaurants
            .filter((restaurant) => restaurant.distance != null && restaurant.distance <= distanceFilter)
            .sort((a, b) => a.distance - b.distance)
        }

        else if (name === 'ALL_RESTAURANTS') {
          restaurantsResult = baseRestaurants
        }

        else if (listFromParams?.length) {
          const ids = new Set(listFromParams.map((r) => String(r._id || r.restaurantId)))
          restaurantsResult = baseRestaurants.filter((r) => ids.has(String(r._id || r.restaurantId)))
        }

        else if (searchTerm) {
          const q = searchTerm.trim().toLowerCase()
          restaurantsResult = baseRestaurants.filter(
            (r) =>
              r.name?.toLowerCase().includes(q) ||
              r.city?.toLowerCase().includes(q)
          )
        }

        else if (name) {
          const allRestaurants = baseRestaurants

          const filtered = allRestaurants.filter(restaurant =>
            restaurant.name?.toLowerCase().includes(name.toLowerCase()) ||
            restaurant.description?.toLowerCase().includes(name.toLowerCase()) ||
            restaurant.city?.toLowerCase().includes(name.toLowerCase())
          )
          restaurantsResult = filtered.length > 0 ? filtered : allRestaurants
        }

        else {

          restaurantsResult = baseRestaurants
        }

        console.warn('📱 Setting restaurant data - Count:', restaurantsResult?.length || 0, 'Mode: restaurants')
        setRestaurantData(restaurantsResult || [])
      } catch (err) {
        console.error('Error loading search results:', err)

        if (name === 'NEAR_ME_SPECIAL' && err.message === 'Location permission denied') {
          setError(i18n.t('search.locationPermissionDenied'))

          const allRestaurants = baseRestaurants
          console.warn('📱 Setting restaurant data (location denied) - Count:', allRestaurants?.length || 0)
          setRestaurantData(allRestaurants)
        } else if (name === 'NEAR_ME_SPECIAL') {
          setError(i18n.t('search.locationError'))

          const allRestaurants = baseRestaurants
          console.warn('📱 Setting restaurant data (location denied) - Count:', allRestaurants?.length || 0)
          setRestaurantData(allRestaurants)
        } else {
          setError(i18n.t('search.errorSubtitle'))
          setRestaurantData([])
        }
      } finally {
        setTimeout(() => setLoader(false), 800)
      }
    }

    loadData()

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

    navigation.setOptions({
      title,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            if (route.params?.fromRestaurantsMap) {
              navigateToRestaurantsMap(navigation)
            } else if (cameFromOffers) {
              navigation.navigate('Offers')
            } else if (fromCategoryResults) {
              navigation.goBack()
            } else {
              navigation.goBack()
            }
          }}
          style={{ padding: 10, marginLeft: 5 }}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('common.goBack')}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      )
    })

  }, [route.params, cameFromOffers, catalogRestaurants])

  useEffect(() => {
    if (route.params?.name === 'NEAR_ME_SPECIAL') {
      const reloadData = async () => {
        setLoader(true)
        setError(null)
        try {

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

          const allRestaurants =
            catalogRestaurants?.length > 0
              ? catalogRestaurants
              : await getRestaurants()
          const filteredRestaurants = allRestaurants
            .filter((restaurant) => restaurant.distance != null && restaurant.distance <= distanceFilter)
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
  }, [distanceFilter, catalogRestaurants])

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

      { }
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
                  {distance}{i18n.t('search.km')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  )

  if (loader) {
    return (
      <SafeAreaView testID="search-results-screen" accessibilityLabel="search-results-screen" style={styles.container}>
        <Loader />
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView testID="search-results-screen" accessibilityLabel="search-results-screen" style={styles.container}>
        <EmptyState query={searchQuery} isError={true} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView testID="search-results-screen" accessibilityLabel="search-results-screen" style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      {restaurantData.length === 0 ? (
        <EmptyState query={searchQuery} isError={false} />
      ) : (
        <FlatList
          data={restaurantData}
          keyExtractor={(item, index) => String(index)}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('RestaurantDetail', {
                  restaurant: item,
                  fromPromotion: cameFromOffers,
                  promotionName: route.params?.name || undefined,
                });
              }}
              style={styles.itemContainer}
              activeOpacity={0.7}
            >
              <RestaurantImage
                image={item.image}
                restaurantId={item._id || item.id || item.restaurantId}
              />
              <RestaurantInfo
                name={item.name}
                rating={item.rating}
                review_count={item.review_count}
                city={item.city}
                collectTime={item.collectTime}
                
                distance={item?.distance}
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
    paddingBottom: 32,
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