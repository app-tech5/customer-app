import { View, Text, useWindowDimensions, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native'
import React, { useContext, useEffect, useRef, useState, useCallback } from 'react'
import MapView, { Marker } from 'react-native-maps'
import { RestaurantInfo, RestaurantImage } from '../components/home/RestaurantItems'
import { MaterialIcons } from '@expo/vector-icons';
import SearchBar from '../components/home/SearchBar'

import Categories from '../components/home/Categories'
import { FlatList } from 'react-native-gesture-handler'
import Reward from '../components/Reward'
import { getDistanceFromLatLonInKm } from '../utils'
import { Icon } from 'react-native-elements'
import { RestaurantsContext } from '../contexts/RestaurantsContext'
import { useSelector } from 'react-redux'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Location from 'expo-location'
import i18n from '../lang/i18n'

export default function RestaurantsMapScreen({ route, navigation }) {
  const { restaurantData } = useContext(RestaurantsContext)
  const {lat,lng} = useSelector((state)=>state.userReducer)
  const [userLocation, setUserLocation] = useState(null)
  const [isManualFocus, setIsManualFocus] = useState(false)
  
  useEffect(() => {
    getUserLocation()
  }, [])

  const getUserLocation = async () => {
    try {
      console.warn('📍 Tentative de récupération de la position utilisateur...')
      
      const userData = await AsyncStorage.getItem('userData')
      if (userData) {
        const user = JSON.parse(userData)
        if (user.location && user.location.latitude && user.location.longitude) {
          const location = {
            lat: user.location.latitude,
            lng: user.location.longitude
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
        accuracy: Location.Accuracy.High
      })

      const userPos = {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      }

      console.warn('✅ Position obtenue par géolocalisation:', userPos)
      setUserLocation(userPos)

    } catch (error) {
      console.error('❌ Erreur lors de la récupération de la position:', error)
    }
  }

  console.warn('🔍 Position utilisateur récupérée:', { lat, lng, userLocation })
  const { width, height } = useWindowDimensions();
  const _map = useRef(null)
  const restaurantsRef = useRef(null)
  
  useEffect(() => {
    if (restaurantData && restaurantData.length > 0 && _map.current) {
      
      const nearbyRestaurants = restaurantData
        .filter(restaurant => {
          if (!restaurant.latitude || !restaurant.longitude) return false
          const distance = userLocation?.lat && userLocation?.lng ?
            getDistanceFromLatLonInKm(
              userLocation.lat, userLocation.lng,
              restaurant.latitude, restaurant.longitude
            ) : 0
          return distance < 5 
        })

      if (nearbyRestaurants.length > 0) {
        
        const lats = nearbyRestaurants.map(r => r.latitude)
        const lngs = nearbyRestaurants.map(r => r.longitude)

        const minLat = Math.min(...lats)
        const maxLat = Math.max(...lats)
        const minLng = Math.min(...lngs)
        const maxLng = Math.max(...lngs)
        
        const latMargin = (maxLat - minLat) * 0.2
        const lngMargin = (maxLng - minLng) * 0.2

        const region = {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: Math.max(maxLat - minLat + latMargin * 2, 0.01),
          longitudeDelta: Math.max(maxLng - minLng + lngMargin * 2, 0.01)
        }

        console.warn('🗺️ Zoom initial ajusté:', region)
        _map.current.animateToRegion(region, 1000)
      }
    }
  }, [restaurantData, userLocation])
  const [visible, setVisible] = useState(route.params?.visible ?? false)
  const [scrollEnabled, setScrollEnabled] = useState(false)
  const [offset, setOffset] = useState(0)
  const [direction, setDirection] = useState("")
  const [focus, setFocus] = useState(new Array(restaurantData?.length || 0).fill({
    backgroundColor: "white",
    color: "black",
    zIndex: 1,
  }))
  const centerMapOnRestaurant = (restaurant) => {
    if (!_map.current) return

    const lat = Number(restaurant.latitude ?? restaurant.lat)
    const lng = Number(restaurant.longitude ?? restaurant.lng)

    if (!lat || !lng) return

    _map.current.animateToRegion({
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005
    }, 300)
  }

  const setFocusFunction = async (index) => {
    setFocus([...Array(index).fill({
      backgroundColor: "white",
      color: "black",
      zIndex: 1
    }), {
      backgroundColor: "black",
      color: "white",
      zIndex: 1000
    }, ...Array(Math.max(0, focus.length - index - 1)).fill({
      backgroundColor: "white",
      color: "black",
      zIndex: 1
    })])
    
    const restaurant = restaurantData[index]
    if (restaurant && userLocation?.lat && userLocation?.lng) {
      const distance = getDistanceFromLatLonInKm(
        userLocation.lat, userLocation.lng,
        restaurant.latitude || restaurant.lat,
        restaurant.longitude || restaurant.lng
      )
      
      if (distance < 10) {
        centerMapOnRestaurant(restaurant)
      }
    }
  }
  
  if (!restaurantData || restaurantData.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Chargement des restaurants...</Text>
      </View>
    )
  }

  return (
    <View style={{
    }}>
      <MapView
        ref={_map}
        initialRegion={{
          latitude: lat || restaurantData[0]?.lat || 48.8566, 
          longitude: lng || restaurantData[0]?.lng || 2.3522, 
          latitudeDelta: 0.005,  
          longitudeDelta: 0.005   
        }}
        style={{
          height: height,
          width: width
        }}
      >
        <RestaurantMarkers restaurantData={restaurantData} focus={focus} setFocusFunction={setFocusFunction} restaurantsRef={restaurantsRef}
          visible={visible} setVisible={setVisible} userLocation={userLocation} />
      </MapView>
      <View style={{ ...styles.header, width: width, }}>
        <TouchableOpacity
          style={styles.arrowBack}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </View>
        </TouchableOpacity>
        <View style={styles.searchbar}>
          <SearchBar restaurantData={restaurantData} navigation={navigation} />
        </View>
        {}
        {userLocation && (
          <TouchableOpacity
            style={styles.locationIndicator}
            onPress={() => {
              if (_map.current && userLocation.lat && userLocation.lng) {
                _map.current.animateToRegion({
                  latitude: userLocation.lat,
                  longitude: userLocation.lng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01
                }, 500)
              }
            }}
          >
            <MaterialIcons name="my-location" size={16} color="#4CAF50" />
          </TouchableOpacity>
        )}
      </View>
      {visible && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60%',
          backgroundColor: 'white',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          elevation: 10
        }}>
          <View style={{
            height: 4,
            width: 40,
            backgroundColor: '#d9d9d9',
            borderRadius: 2,
            alignSelf: 'center',
            marginTop: 10,
            marginBottom: 10
          }} />
          <RestaurantsView restaurantsRef={restaurantsRef} restaurantData={restaurantData} setFocusFunction={setFocusFunction}
            focus={focus} _map={_map} width={width} horizontal={false} Categories={Categories} scrollEnabled={true}
            setDirection={setDirection} setOffset={setOffset} offset={offset} direction={direction}
            setScrollEnabled={setScrollEnabled} navigation={navigation} userLocation={userLocation} isManualFocus={isManualFocus} setIsManualFocus={setIsManualFocus}/>
        </View>
      )}
      {!visible && <RestaurantsView restaurantsRef={restaurantsRef} restaurantData={restaurantData} setFocusFunction={setFocusFunction}
        focus={focus} _map={_map} width={width} horizontal={true} setVisible={setVisible} navigation={navigation} userLocation={userLocation} isManualFocus={isManualFocus} setIsManualFocus={setIsManualFocus}/>}
    </View>
  )
}
const RestaurantsView = ({ _map, restaurantsRef, restaurantData, setFocusFunction, focus, width, horizontal,
  Categories, scrollEnabled, offset, setOffset, direction, setDirection, setScrollEnabled, setVisible, navigation, userLocation, isManualFocus, setIsManualFocus}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeout = useRef(null)
  
  const sortedRestaurants = React.useMemo(() => {
    console.warn('🏪 RestaurantsView - Filtrage restaurants proches, horizontal:', horizontal)
    return restaurantData
      .filter(restaurant => restaurant.latitude && restaurant.longitude)
      .map((restaurant, originalIndex) => ({
        ...restaurant,
        originalIndex,
        distance: userLocation?.lat && userLocation?.lng ?
          getDistanceFromLatLonInKm(
            userLocation.lat, userLocation.lng,
            restaurant.latitude, restaurant.longitude
          ) : null
      }))
      .filter(restaurant => restaurant.distance !== null && restaurant.distance < 10) 
      .sort((a, b) => a.distance - b.distance) 
  }, [restaurantData, userLocation])

  console.warn(`🏪 RestaurantsView - ${sortedRestaurants.length} restaurants triés pour ${horizontal ? 'carrousel' : 'liste'}`)
  
  const calculateIndexFromScroll = useCallback((scrollX, containerWidth) => {
    const itemWidth = containerWidth
    const rawIndex = scrollX / itemWidth
    return Math.max(0, Math.min(sortedRestaurants.length - 1, Math.round(rawIndex)))
  }, [sortedRestaurants.length])
  
  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [])

  return (
    <View style={horizontal ? styles.flatlist : {}}>
      {horizontal && <ListButton setVisible={setVisible} />}
      <FlatList
        ref={restaurantsRef}
        horizontal={horizontal}
        data={sortedRestaurants}
        keyExtractor={(item, index) => `${item.id || item._id || index}`}
        renderItem={({ item, index }) => {
          const isActive = horizontal && index === currentIndex
          return (
          <TouchableOpacity
            style={{
              ...styles.restaurant,
              width: horizontal ? width * 0.85 : "auto",
              transform: horizontal ? [{ scale: isActive ? 1 : 0.95 }] : [],
              opacity: horizontal ? (isActive ? 1 : 0.7) : 1
            }}
            onPress={()=>navigation.navigate("RestaurantDetail", { restaurant: item })}
            activeOpacity={0.8}
          >
            <View style={{
              ...styles.restaurantImage_restaurantInfo,
              paddingTop: horizontal ? 15 : "auto",
              paddingVertical: horizontal ? "auto" : 10,
              shadowColor: horizontal ? "#000" : "transparent",
              shadowOffset: horizontal ? { width: 0, height: 2 } : { width: 0, height: 0 },
              shadowOpacity: horizontal ? 0.1 : 0,
              shadowRadius: horizontal ? 4 : 0,
              elevation: horizontal ? 3 : 0
            }}>
              <RestaurantImage image={item.image} />
              <RestaurantInfo
                name={item.name}
                rating={item.rating}
                city={item.city} />
              {!horizontal && <Reward restaurant={item} />}
            </View>
          </TouchableOpacity>)
        }}
        scrollEnabled={scrollEnabled}
        showsHorizontalScrollIndicator={false}
        snapToAlignment={horizontal ? "center" : "start"}
        snapToInterval={horizontal ? width * 0.85 + 16 : undefined} 
        decelerationRate={horizontal ? "fast" : "normal"}
        onScrollBeginDrag={horizontal ? () => {
          setIsScrolling(true)
          
          if (scrollTimeout.current) {
            clearTimeout(scrollTimeout.current)
          }
        } : undefined}
        onScrollEndDrag={horizontal ? (event) => {
          
          scrollTimeout.current = setTimeout(() => {
            setIsScrolling(false)
          }, 100)
        } : undefined}
        onMomentumScrollEnd={horizontal ? (event) => {
          const { contentOffset, layoutMeasurement } = event.nativeEvent
          const scrollX = contentOffset.x
          const containerWidth = layoutMeasurement.width || width * 0.85

          const finalIndex = calculateIndexFromScroll(scrollX, containerWidth)

          setCurrentIndex(finalIndex)
          setIsScrolling(false)
          
          const originalIndex = sortedRestaurants[finalIndex]?.originalIndex
          if (originalIndex !== undefined) {
            setFocusFunction(originalIndex)
          }
        } : () => { }}
        onScroll={horizontal ? (event) => {
          const { contentOffset, layoutMeasurement } = event.nativeEvent
          const scrollX = contentOffset.x
          const containerWidth = layoutMeasurement.width || width * 0.85

          const newIndex = calculateIndexFromScroll(scrollX, containerWidth)
          
          if (newIndex !== currentIndex && !isScrolling) {
            setCurrentIndex(newIndex)
            
            const originalIndex = sortedRestaurants[newIndex]?.originalIndex
            if (originalIndex !== undefined) {
              setFocusFunction(originalIndex)
            }
          }
        } : (event) => {
          setDirection(event.nativeEvent.contentOffset.y > offset ? 'up' : 'down')
          setOffset(event.nativeEvent.contentOffset.y)
          if (event.nativeEvent.contentOffset.y === 0 && direction === "down")
            setScrollEnabled(false)
        }}
        ListHeaderComponent={!horizontal ? () => <View style={styles.categories}>
          <Categories />
        </View> : <></>}
      />
      {horizontal && restaurantData && restaurantData.length > 1 && (
        <View style={styles.paginationContainer}>
          {restaurantData.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive
              ]}
              onPress={() => {
                
                setCurrentIndex(index)
                restaurantsRef.current?.scrollToIndex({
                  index,
                  animated: true,
                  viewPosition: 0.5 
                })
                
                const restaurant = restaurantData[index]
                animateMapToRestaurant(restaurant, 150)

                setFocusFunction(index)
              }}
            />
          ))}
        </View>
      )}
    </View>
  )
}
const RestaurantMarkers = ({ restaurantData, focus, setFocusFunction, restaurantsRef, visible, setVisible, userLocation }) => {
  console.warn('🗺️ RestaurantMarkers - Tri des restaurants par distance')
  
  const restaurantsWithDistance = restaurantData
    .filter(restaurant => {
      const lat = restaurant.latitude || restaurant.lat
      const lng = restaurant.longitude || restaurant.lng
      return lat && lng
    })
    .map((restaurant, originalIndex) => {
      const lat = restaurant.latitude || restaurant.lat
      const lng = restaurant.longitude || restaurant.lng

      let distance = null
      if (userLocation?.lat && userLocation?.lng) {
        distance = getDistanceFromLatLonInKm(
          userLocation.lat, userLocation.lng,
          lat, lng
        )
      }

      return {
        ...restaurant,
        originalIndex,
        latitude: lat,
        longitude: lng,
        distance
      }
    })
    .sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0
      if (a.distance === null) return 1
      if (b.distance === null) return -1
      return a.distance - b.distance
    })
    .slice(0, 20) 

  console.warn(`✅ ${restaurantsWithDistance.length} restaurants les plus proches trouvés`)
  restaurantsWithDistance.forEach((r, i) => {
    console.warn(`${i+1}. ${r.name}: ${r.distance?.toFixed(2)} km`)
  })

  return restaurantsWithDistance.map((restaurant, displayIndex) => {

    const focusStyle = focus[restaurant.originalIndex] || { backgroundColor: "white", color: "black", zIndex: 1 }

    return (
      <Marker
        key={`marker-${restaurant.originalIndex}`}
        coordinate={{
          latitude: parseFloat(restaurant.latitude),
          longitude: parseFloat(restaurant.longitude),
        }}
        title={restaurant.name || "Restaurant"}
        description={restaurant.distance ? `${restaurant.distance.toFixed(1)} km` : "Distance inconnue"}
        onPress={() => {
          if (visible) setVisible(false)
          setTimeout(() => {
            
            const sortedRestaurants = restaurantData
              .filter(r => r.latitude && r.longitude)
              .map((r, originalIndex) => ({
                ...r,
                originalIndex,
                distance: userLocation?.lat && userLocation?.lng ?
                  getDistanceFromLatLonInKm(
                    userLocation.lat, userLocation.lng,
                    r.latitude || r.lat,
                    r.longitude || r.lng
                  ) : null
              }))
              .filter(r => r.distance !== null && r.distance < 10)
              .sort((a, b) => a.distance - b.distance)
            
            const carouselIndex = sortedRestaurants.findIndex(r => r.originalIndex === restaurant.originalIndex)

            if (carouselIndex !== -1) {
              console.warn(`🎯 Marker cliqué: ${restaurant.name} → Index carrousel: ${carouselIndex}`)
              setFocusFunction(carouselIndex)
              restaurantsRef.current?.scrollToIndex({
                index: carouselIndex,
                animated: true,
                viewPosition: 0.5
              })
            } else {
              console.warn(`❌ Restaurant ${restaurant.name} pas dans le carrousel (< 10km)`)
            }
          }, 300)
        }}
      >
        <View style={{
          ...styles.restaurant_marker,
          backgroundColor: focusStyle.backgroundColor,
          zIndex: focusStyle.zIndex
        }}>
          <MaterialIcons
            style={styles.restaurant_marker_icon}
            name="restaurant"
            size={focusStyle.backgroundColor === "black" ? 18 : 15}
            color={focusStyle.color}
          />
        </View>
      </Marker>
    )
  }).filter(marker => marker !== null)
}
const ListButton = ({ setVisible }) => {
  return (
    <View style={styles.menuList}>
      <View style={styles.menuListBloc}>
        <Icon type="material-community" name='menu' color="black" size={32}
          onPress={() => setVisible(true)} />
        <Text style={{ fontWeight: "bold" }}>{i18n.t('search.list')}</Text>
      </View>
    </View>
  )
}
const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10
  },
  arrowBack: {
    padding: 10,
    marginLeft: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  locationIndicator: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === "android" ? StatusBar.currentHeight + 15 : 55,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  searchbar: { flex: 1, marginHorizontal: 10 },
  categories: {
    marginBottom: 10
  },
  bubble: {
    flexDirection: "row",
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 6,
    borderColor: '#ccc',
    borderWidth: 0.5,
    padding: 15,
  },
  bubbleName: {
    fontSize: 16,
    marginBottom: 5,
  },
  activityIndicator: {
    backgroundColor: 'black',
    position: 'absolute',
    opacity: 0.6,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    width: "100%",
  },
  restaurant_marker: {
    backgroundColor: "white",
    borderRadius: 20,
    position: "absolute",
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 30,
    minHeight: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  restaurant_marker_shadow: {
    backgroundColor: "grey",
    top: 0, left: 0,
    width: 43, height: 43
  },
  restaurant_marker_icon: {
    padding: 6,
  },
  flatlist: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 30,
    paddingLeft: 20, 
  },
  restaurantsContainer:
  {
    flexDirection: "row"
  },
  restaurant: {
    borderRadius: 15,
    backgroundColor: "white",
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  restaurantImage_restaurantInfo: {
    marginHorizontal: 10,
  },
  restaurant_title: {
    paddingHorizontal: 50,
    paddingVertical: 50,
  },
  menuList: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  menuListBloc: {
    backgroundColor: "white",
    width: 70,
    flexDirection: "row",
    marginRight: 15,
    alignItems: "center",
    justifyContent: "space-around",
    borderRadius: 20,
    padding: 5,
    marginBottom: 10
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingBottom: 20
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: 12,
    height: 8,
    borderRadius: 4,
  }
})