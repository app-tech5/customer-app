import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import { RestaurantsContext } from '../contexts/RestaurantsContext'
import { useSelector } from 'react-redux'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Location from 'expo-location'
import SearchBar from '../components/home/SearchBar'
import OpenStreetMap from '../components/restaurantsMap/OpenStreetMap'
import RestaurantsView from '../components/restaurantsMap/RestaurantsView'
import MapBottomSheet from '../components/restaurantsMap/MapBottomSheet'
import styles from '../components/restaurantsMap/styles'
import {
  DEFAULT_REGION,
  buildMapRestaurants,
  buildSortedRestaurants,
  createDefaultFocus,
  createFocusedState,
  getNearbyRestaurantsRegion,
  getRestaurantCoordinates,
} from '../utils'

export default function RestaurantsMapScreen({ route, navigation }) {
  const { restaurantData } = useContext(RestaurantsContext)
  const { lat, lng } = useSelector((state) => state.userReducer)
  const [userLocation, setUserLocation] = useState(null)
  const [focus, setFocus] = useState(createDefaultFocus(restaurantData?.length || 0))
  const [visible, setVisible] = useState(route.params?.visible ?? false)
  const [scrollEnabled, setScrollEnabled] = useState(false)
  const [offset, setOffset] = useState(0)
  const [direction, setDirection] = useState('')
  const [targetCarouselIndex, setTargetCarouselIndex] = useState(null)
  const pendingCarouselIndexRef = useRef(null)
  const { width, height } = useWindowDimensions()
  const restaurantsRef = useRef(null)

  useEffect(() => {
    getUserLocation()
  }, [])

  useEffect(() => {
    setFocus(createDefaultFocus(restaurantData?.length || 0))
  }, [restaurantData?.length])

  const getUserLocation = async () => {
    try {
      console.warn('📍 Tentative de récupération de la position utilisateur...')

      const userData = await AsyncStorage.getItem('userData')
      if (userData) {
        const user = JSON.parse(userData)
        if (user.location && user.location.latitude && user.location.longitude) {
          const location = {
            lat: user.location.latitude,
            lng: user.location.longitude,
          }
          console.warn('✅ Position trouvée dans AsyncStorage:', location)
          setUserLocation(location)
          return
        }
      }

      console.warn('📍 Pas de position dans AsyncStorage, demande de géolocalisation...')
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        console.warn('❌ Permission de géolocalisation refusée')
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      const userPos = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      }

      console.warn('✅ Position obtenue par géolocalisation:', userPos)
      setUserLocation(userPos)

    } catch (error) {
      console.error('❌ Erreur lors de la récupération de la position:', error)
    }
  }

  const firstRestaurantCoordinates = getRestaurantCoordinates(restaurantData?.[0])
  const initialRegion = React.useMemo(() => ({
    latitude: lat || firstRestaurantCoordinates?.latitude || DEFAULT_REGION.latitude,
    longitude: lng || firstRestaurantCoordinates?.longitude || DEFAULT_REGION.longitude,
    latitudeDelta: DEFAULT_REGION.latitudeDelta,
    longitudeDelta: DEFAULT_REGION.longitudeDelta,
  }), [firstRestaurantCoordinates?.latitude, firstRestaurantCoordinates?.longitude, lat, lng])
  const [mapRegion, setMapRegion] = useState(initialRegion)
  const mapRestaurants = React.useMemo(() => buildMapRestaurants(restaurantData || [], userLocation), [restaurantData, userLocation])

  const animateMapToRegion = useCallback((region) => {
    if (!region) return

    setMapRegion({
      latitude: region.latitude,
      longitude: region.longitude,
      latitudeDelta: region.latitudeDelta ?? DEFAULT_REGION.latitudeDelta,
      longitudeDelta: region.longitudeDelta ?? DEFAULT_REGION.longitudeDelta,
    })
  }, [])

  const focusedOriginalIndex = focus.findIndex((item) => item.backgroundColor === "black")

  useEffect(() => {
    setMapRegion(initialRegion)
  }, [initialRegion])

  useEffect(() => {
    if (restaurantData && restaurantData.length > 0) {
      const region = getNearbyRestaurantsRegion(restaurantData, userLocation)
      if (region) {
        console.warn('🗺️ Zoom initial ajusté:', region)
        animateMapToRegion(region)
      }
    }
  }, [animateMapToRegion, restaurantData, userLocation])

  const centerMapOnRestaurant = useCallback((restaurant) => {
    const coordinates = getRestaurantCoordinates(restaurant)
    if (!coordinates) return

    animateMapToRegion({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    })
  }, [animateMapToRegion])

  const setFocusFunction = useCallback((index) => {
    if (index == null || index < 0 || !restaurantData?.[index]) return

    setFocus(createFocusedState(restaurantData.length, index))
    centerMapOnRestaurant(restaurantData[index])
  }, [centerMapOnRestaurant, restaurantData])

  const handleMarkerPress = useCallback((originalIndex) => {
    const restaurant = restaurantData?.[originalIndex]
    if (!restaurant) return

    const sortedRestaurants = buildSortedRestaurants(restaurantData || [], userLocation)
    const carouselIndex = sortedRestaurants.findIndex((item) => item.originalIndex === originalIndex)

    if (carouselIndex === -1) {
      console.warn(`❌ Restaurant ${restaurant.name} pas dans le carrousel (< 10km)`)
      return
    }

    console.warn(`🎯 Marker cliqué: ${restaurant.name} → Index carrousel: ${carouselIndex}`)
    setFocusFunction(originalIndex)

    if (visible) {
      pendingCarouselIndexRef.current = carouselIndex
      setVisible(false)
      return
    }

    setTargetCarouselIndex(carouselIndex)
  }, [restaurantData, setFocusFunction, userLocation, visible])

  useEffect(() => {
    if (visible || pendingCarouselIndexRef.current === null) return

    const carouselIndex = pendingCarouselIndexRef.current
    pendingCarouselIndexRef.current = null
    setTargetCarouselIndex(carouselIndex)
  }, [visible])
  
  if (!restaurantData || restaurantData.length === 0) {
    return (
      <View testID="restaurants-map-empty-state" accessibilityLabel="restaurants-map-empty-state" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text testID="restaurants-map-loading-text" accessibilityLabel="restaurants-map-loading-text">Chargement des restaurants...</Text>
      </View>
    )
  }

  return (
    <View testID="restaurants-map-screen" accessibilityLabel="restaurants-map-screen">
      <View testID="restaurants-map-container" accessibilityLabel="restaurants-map-container" style={{ height, width }}>
        <OpenStreetMap
          testID="restaurants-map-webview"
          initialRegion={initialRegion}
          targetRegion={mapRegion}
          restaurants={mapRestaurants}
          focusedOriginalIndex={focusedOriginalIndex}
          userLocation={userLocation}
          onMarkerPress={handleMarkerPress}
        />
      </View>
      <View testID="restaurants-map-header" accessibilityLabel="restaurants-map-header" style={{ ...styles.header, width: width, }}>
        <TouchableOpacity
          testID="restaurants-map-back-button"
          accessibilityLabel="restaurants-map-back-button"
          style={styles.arrowBack}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </View>
        </TouchableOpacity>
        <View style={styles.searchbar}>
          <SearchBar
            inputTestID="restaurants-map-search-input"
            submitTestID="restaurants-map-search-submit"
            restaurantData={restaurantData}
            navigation={navigation}
            showSubmitButton={false}
            containerStyle={{ marginTop: 0, flex: 1 }}
          />
        </View>
        {userLocation && (
          <TouchableOpacity
            testID="restaurants-map-location-button"
            accessibilityLabel="restaurants-map-location-button"
            style={styles.locationButton}
            onPress={() => {
              if (userLocation.lat && userLocation.lng) {
                animateMapToRegion({
                  latitude: userLocation.lat,
                  longitude: userLocation.lng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                })
              }
            }}
          >
            <MaterialIcons name="my-location" size={18} color="#4CAF50" />
          </TouchableOpacity>
        )}
      </View>
      {visible && (
        <MapBottomSheet visible={visible} onClose={() => setVisible(false)}>
          <RestaurantsView
            restaurantsRef={restaurantsRef}
            restaurantData={restaurantData}
            setFocusFunction={setFocusFunction}
            width={width}
            horizontal={false}
            scrollEnabled
            setDirection={setDirection}
            setOffset={setOffset}
            offset={offset}
            direction={direction}
            setScrollEnabled={setScrollEnabled}
            setVisible={setVisible}
            navigation={navigation}
            userLocation={userLocation}
            onSelectRestaurant={centerMapOnRestaurant}
          />
        </MapBottomSheet>
      )}
      {!visible && (
        <RestaurantsView
          restaurantsRef={restaurantsRef}
          restaurantData={restaurantData}
          setFocusFunction={setFocusFunction}
          width={width}
          horizontal
          setVisible={setVisible}
          navigation={navigation}
          userLocation={userLocation}
          onSelectRestaurant={centerMapOnRestaurant}
          targetCarouselIndex={targetCarouselIndex}
          onTargetCarouselIndexHandled={() => setTargetCarouselIndex(null)}
        />
      )}
    </View>
  )
}