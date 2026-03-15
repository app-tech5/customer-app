import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Dimensions } from 'react-native'
import React, { useEffect, useState } from 'react'
import { getRestaurants } from '../api'
import { RestaurantImage, RestaurantInfo } from '../components/home/RestaurantItems'
import Loader from './Loader'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n from '../i18n'
import { colors, getDistanceFromLatLonInKm } from '../global'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'

const { width } = Dimensions.get('window')

export default function NearMeScreen({ route, navigation }) {
  const [restaurantData, setRestaurantData] = useState([])
  const [loader, setLoader] = useState(true)
  const [error, setError] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [distanceFilter, setDistanceFilter] = useState(10)
  const [viewMode, setViewMode] = useState('list') 

  useEffect(() => {
    loadNearbyRestaurants()
  }, [distanceFilter])

  const loadNearbyRestaurants = async () => {
    try {
      setLoader(true)
      setError(null)
      
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

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        })
        userLat = location.coords.latitude
        userLon = location.coords.longitude
      }

      setUserLocation({ latitude: userLat, longitude: userLon })
      
      const allRestaurants = await getRestaurants()

      const nearbyRestaurants = allRestaurants
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

      setRestaurantData(nearbyRestaurants)

    } catch (err) {
      console.error('Error loading nearby restaurants:', err)
      if (err.message === 'Location permission denied') {
        setError(i18n.t('search.locationPermissionDenied'))
      } else {
        setError(i18n.t('search.locationError'))
      }
    } finally {
      setTimeout(() => setLoader(false), 800)
    }
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.viewModeButton}
          disabled={true}
          onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
        >
          <Ionicons
            name="map-outline"
            size={20}
            color={colors.grey[400]}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.resultInfo}>
        <Text style={styles.resultCount}>
          {restaurantData.length} {restaurantData.length === 1 ? i18n.t('search.result') : i18n.t('search.results')}
        </Text>
        <Text style={styles.locationText}>
          {i18n.t('search.within')} {distanceFilter}{i18n.t('search.km')}
        </Text>
      </View>

      {}
      <View style={styles.distanceControls}>
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

      {}
      {userLocation && (
        <View style={styles.locationIndicator}>
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={styles.locationText}>
            {i18n.t('search.locationActive', 'Location active')}
          </Text>
        </View>
      )}
    </View>
  )

  if (loader) return <Loader />

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="location-off" size={64} color={colors.grey[400]} />
          <Text style={styles.errorTitle}>{i18n.t('search.locationError')}</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadNearbyRestaurants}>
            <Text style={styles.retryButtonText}>{i18n.t('search.retry', 'Retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      {viewMode === 'list' ? (
        <FlatList
          data={restaurantData}
          keyExtractor={(item, index) => String(index)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.restaurantItem}
              onPress={() => {
                navigation.navigate('BottomTabs', {
                  screen: 'Home',
                  params: {
                    screen: 'RestaurantDetail',
                    params: { restaurant: item }
                  }
                })
              }}
              activeOpacity={0.7}
            >
              <RestaurantImage image={item.image} />
              <RestaurantInfo
                name={item.name}
                rating={item.rating}
                city={item.city}
                distance={item.distance}
              />
              {}
              <View style={styles.distanceBadge}>
                <Ionicons name="location" size={12} color="#4CAF50" />
                <Text style={styles.distanceBadgeText}>
                  {item.distance.toFixed(1)} {i18n.t('search.km')}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.mapContainer}>
          <Text style={styles.mapPlaceholder}>
            {i18n.t('search.mapPlaceholder')}{'\n'}
            {i18n.t('search.position')}: {userLocation?.latitude?.toFixed(4)}, {userLocation?.longitude?.toFixed(4)}{'\n'}
            {i18n.t('search.restaurantsFound', { count: restaurantData.length })}
          </Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    padding: 16,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewModeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.grey[100],
    opacity: 0.5,
  },
  resultInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resultCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  distanceControls: {
    marginBottom: 12,
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
  locationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(61, 92, 92, 0.1)', 
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 6,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  restaurantItem: {
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
  distanceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
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
  mapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  mapPlaceholder: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
})
