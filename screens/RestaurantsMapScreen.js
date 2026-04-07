import { View, Text, useWindowDimensions, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native'
import React, { useContext, useEffect, useRef, useState, useCallback } from 'react'
import { WebView } from 'react-native-webview'
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

const DEFAULT_REGION = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
}

const getRestaurantCoordinates = (restaurant) => {
  const latitude = Number(restaurant?.latitude ?? restaurant?.lat)
  const longitude = Number(restaurant?.longitude ?? restaurant?.lng)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }

  return { latitude, longitude }
}

const buildSortedRestaurants = (restaurantData, userLocation) => {
  return restaurantData
    .map((restaurant, originalIndex) => {
      const coordinates = getRestaurantCoordinates(restaurant)

      if (!coordinates) {
        return null
      }

      return {
        ...restaurant,
        originalIndex,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        distance: userLocation?.lat && userLocation?.lng
          ? getDistanceFromLatLonInKm(
            userLocation.lat,
            userLocation.lng,
            coordinates.latitude,
            coordinates.longitude
          )
          : null,
      }
    })
    .filter(Boolean)
    .filter((restaurant) => restaurant.distance !== null && restaurant.distance < 10)
    .sort((a, b) => a.distance - b.distance)
}

const buildMapRestaurants = (restaurantData, userLocation) => {
  return restaurantData
    .map((restaurant, originalIndex) => {
      const coordinates = getRestaurantCoordinates(restaurant)

      if (!coordinates) {
        return null
      }

      return {
        ...restaurant,
        originalIndex,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        distance: userLocation?.lat && userLocation?.lng
          ? getDistanceFromLatLonInKm(
            userLocation.lat,
            userLocation.lng,
            coordinates.latitude,
            coordinates.longitude
          )
          : null,
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0
      if (a.distance === null) return 1
      if (b.distance === null) return -1
      return a.distance - b.distance
    })
    .slice(0, 20)
}

const getZoomLevel = (latitudeDelta = 0.005) => {
  const safeDelta = Math.max(Number(latitudeDelta) || 0.005, 0.0005)
  return Math.max(3, Math.min(18, Math.round(Math.log2(360 / safeDelta))))
}

const createOpenStreetMapHtml = (initialRegion) => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    />
    <style>
      html, body, #map {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #f5f5f5;
      }

      .leaflet-control-attribution {
        font-size: 10px;
      }

      .map-marker-wrapper {
        background: transparent;
        border: none;
      }

      .map-marker {
        width: 30px;
        height: 30px;
        border-radius: 15px;
        background: #ffffff;
        border: 1px solid rgba(0, 0, 0, 0.15);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.22);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .map-marker.active {
        background: #000000;
      }

      .map-marker-dot {
        width: 12px;
        height: 12px;
        border-radius: 6px;
        background: #000000;
      }

      .map-marker.active .map-marker-dot {
        background: #ffffff;
      }

      .user-marker {
        width: 18px;
        height: 18px;
        border-radius: 9px;
        background: #4caf50;
        border: 3px solid #ffffff;
        box-shadow: 0 1px 6px rgba(0, 0, 0, 0.3);
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const initialRegion = ${JSON.stringify(initialRegion)};
      const map = L.map('map', {
        zoomControl: false,
        preferCanvas: true,
      }).setView(
        [initialRegion.latitude, initialRegion.longitude],
        ${getZoomLevel(initialRegion.latitudeDelta)}
      );

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const markerLayer = L.layerGroup().addTo(map);
      let userMarker = null;

      const escapeHtml = (value) =>
        String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');

      const getMarkerIcon = (isActive) =>
        L.divIcon({
          className: 'map-marker-wrapper',
          html:
            '<div class="map-marker' +
            (isActive ? ' active' : '') +
            '"><div class="map-marker-dot"></div></div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

      const syncMarkers = (payload) => {
        markerLayer.clearLayers();

        (payload.restaurants || []).forEach((restaurant) => {
          const marker = L.marker(
            [restaurant.latitude, restaurant.longitude],
            {
              icon: getMarkerIcon(restaurant.originalIndex === payload.focusedOriginalIndex),
              zIndexOffset: restaurant.originalIndex === payload.focusedOriginalIndex ? 1000 : 1,
            }
          );

          marker.bindPopup(
            '<strong>' +
              escapeHtml(restaurant.name || 'Restaurant') +
              '</strong><br />' +
              escapeHtml(
                restaurant.distance !== null && restaurant.distance !== undefined
                  ? restaurant.distance.toFixed(1) + ' km'
                  : 'Distance inconnue'
              )
          );

          marker.on('click', () => {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  type: 'MARKER_PRESS',
                  payload: { originalIndex: restaurant.originalIndex },
                })
              );
            }
          });

          marker.addTo(markerLayer);
        });

        if (payload.userLocation && payload.userLocation.lat && payload.userLocation.lng) {
          if (userMarker) {
            map.removeLayer(userMarker);
          }

          userMarker = L.marker(
            [payload.userLocation.lat, payload.userLocation.lng],
            {
              icon: L.divIcon({
                className: 'map-marker-wrapper',
                html: '<div class="user-marker"></div>',
                iconSize: [18, 18],
                iconAnchor: [9, 9],
              }),
            }
          ).addTo(map);
        }
      };

      const setRegion = (region, animated = true) => {
        if (!region) return;

        const zoom = Math.max(
          3,
          Math.min(18, Math.round(Math.log2(360 / Math.max(region.latitudeDelta || 0.005, 0.0005))))
        );

        if (animated) {
          map.flyTo([region.latitude, region.longitude], zoom, { duration: 0.5 });
          return;
        }

        map.setView([region.latitude, region.longitude], zoom);
      };

      window.__updateMap = (message) => {
        if (!message || !message.type) return;

        if (message.type === 'SYNC_MAP') {
          syncMarkers(message.payload || {});
          return;
        }

        if (message.type === 'ANIMATE_TO_REGION') {
          setRegion(message.payload, true);
        }
      };

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
      }
    </script>
  </body>
</html>`

const OpenStreetMap = ({
  initialRegion,
  targetRegion,
  restaurants,
  focusedOriginalIndex,
  userLocation,
  onMarkerPress,
}) => {
  const webViewRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)

  const injectMapMessage = useCallback((message) => {
    if (!webViewRef.current || !mapReady) {
      return
    }

    const escapedMessage = JSON.stringify(message).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    webViewRef.current.injectJavaScript(`
      if (window.__updateMap) {
        window.__updateMap(JSON.parse('${escapedMessage}'));
      }
      true;
    `)
  }, [mapReady])

  useEffect(() => {
    injectMapMessage({
      type: 'SYNC_MAP',
      payload: {
        restaurants,
        focusedOriginalIndex,
        userLocation,
      },
    })
  }, [focusedOriginalIndex, injectMapMessage, restaurants, userLocation])

  useEffect(() => {
    injectMapMessage({
      type: 'ANIMATE_TO_REGION',
      payload: targetRegion,
    })
  }, [injectMapMessage, targetRegion])

  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)

      if (data.type === 'MAP_READY') {
        setMapReady(true)
        return
      }

      if (data.type === 'MARKER_PRESS') {
        onMarkerPress?.(data.payload?.originalIndex)
      }
    } catch (error) {
      console.warn('Erreur message carte OSM:', error)
    }
  }, [onMarkerPress])

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={['*']}
      source={{ html: createOpenStreetMapHtml(initialRegion) }}
      onMessage={handleMessage}
      javaScriptEnabled
      domStorageEnabled
      mixedContentMode="always"
      style={StyleSheet.absoluteFill}
    />
  )
}

export default function RestaurantsMapScreen({ route, navigation }) {
  const { restaurantData } = useContext(RestaurantsContext)
  const {lat,lng} = useSelector((state)=>state.userReducer)
  const [userLocation, setUserLocation] = useState(null)
  const [isManualFocus, setIsManualFocus] = useState(false)
  const [focus, setFocus] = useState(new Array(restaurantData?.length || 0).fill({
    backgroundColor: "white",
    color: "black",
    zIndex: 1,
  }))
  
  useEffect(() => {
    getUserLocation()
  }, [])

  useEffect(() => {
    setFocus(new Array(restaurantData?.length || 0).fill({
      backgroundColor: "white",
      color: "black",
      zIndex: 1,
    }))
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

  const { width, height } = useWindowDimensions();
  const restaurantsRef = useRef(null)
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
      const nearbyRestaurants = restaurantData
        .map((restaurant) => {
          const coordinates = getRestaurantCoordinates(restaurant)
          if (!coordinates) return null
          const distance = userLocation?.lat && userLocation?.lng ?
            getDistanceFromLatLonInKm(
              userLocation.lat, userLocation.lng,
              coordinates.latitude, coordinates.longitude
            ) : 0
          return distance < 5 ? coordinates : null
        })
        .filter(Boolean)

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
        animateMapToRegion(region)
      }
    }
  }, [animateMapToRegion, restaurantData, userLocation])
  const [visible, setVisible] = useState(route.params?.visible ?? false)
  const [scrollEnabled, setScrollEnabled] = useState(false)
  const [offset, setOffset] = useState(0)
  const [direction, setDirection] = useState("")
  const centerMapOnRestaurant = (restaurant) => {
    const coordinates = getRestaurantCoordinates(restaurant)
    if (!coordinates) return

    animateMapToRegion({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005
    })
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
      const coordinates = getRestaurantCoordinates(restaurant)
      if (!coordinates) return

      const distance = getDistanceFromLatLonInKm(
        userLocation.lat, userLocation.lng,
        coordinates.latitude,
        coordinates.longitude
      )
      
      if (distance < 10) {
        centerMapOnRestaurant(restaurant)
      }
    }
  }

  const handleMarkerPress = useCallback((originalIndex) => {
    const restaurant = restaurantData?.[originalIndex]
    if (!restaurant) return

    if (visible) {
      setVisible(false)
    }

    setTimeout(() => {
      const sortedRestaurants = buildSortedRestaurants(restaurantData || [], userLocation)
      const carouselIndex = sortedRestaurants.findIndex((item) => item.originalIndex === originalIndex)

      if (carouselIndex !== -1) {
        console.warn(`🎯 Marker cliqué: ${restaurant.name} → Index carrousel: ${carouselIndex}`)
        setFocusFunction(originalIndex)
        restaurantsRef.current?.scrollToIndex({
          index: carouselIndex,
          animated: true,
          viewPosition: 0.5
        })
      } else {
        console.warn(`❌ Restaurant ${restaurant.name} pas dans le carrousel (< 10km)`)
      }
    }, 300)
  }, [restaurantData, setVisible, setFocusFunction, userLocation, visible])
  
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
      <View style={{
        height: height,
        width: width
      }}>
        <OpenStreetMap
          initialRegion={initialRegion}
          targetRegion={mapRegion}
          restaurants={mapRestaurants}
          focusedOriginalIndex={focusedOriginalIndex}
          userLocation={userLocation}
          onMarkerPress={handleMarkerPress}
        />
      </View>
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
              if (userLocation.lat && userLocation.lng) {
                animateMapToRegion({
                  latitude: userLocation.lat,
                  longitude: userLocation.lng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01
                })
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
            focus={focus} width={width} horizontal={false} Categories={Categories} scrollEnabled={true}
            setDirection={setDirection} setOffset={setOffset} offset={offset} direction={direction}
            setScrollEnabled={setScrollEnabled} navigation={navigation} userLocation={userLocation} isManualFocus={isManualFocus} setIsManualFocus={setIsManualFocus}
            onSelectRestaurant={centerMapOnRestaurant} />
        </View>
      )}
      {!visible && <RestaurantsView restaurantsRef={restaurantsRef} restaurantData={restaurantData} setFocusFunction={setFocusFunction}
        focus={focus} width={width} horizontal={true} setVisible={setVisible} navigation={navigation} userLocation={userLocation} isManualFocus={isManualFocus} setIsManualFocus={setIsManualFocus}
        onSelectRestaurant={centerMapOnRestaurant} />}
    </View>
  )
}
const RestaurantsView = ({ restaurantsRef, restaurantData, setFocusFunction, focus, width, horizontal,
  Categories, scrollEnabled, offset, setOffset, direction, setDirection, setScrollEnabled, setVisible, navigation, userLocation, isManualFocus, setIsManualFocus, onSelectRestaurant}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeout = useRef(null)
  
  const sortedRestaurants = React.useMemo(() => {
    console.warn('🏪 RestaurantsView - Filtrage restaurants proches, horizontal:', horizontal)
    return buildSortedRestaurants(restaurantData, userLocation)
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
      {horizontal && sortedRestaurants.length > 1 && (
        <View style={styles.paginationContainer}>
          {sortedRestaurants.map((restaurant, index) => (
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

                onSelectRestaurant?.(restaurant)
                setFocusFunction(restaurant.originalIndex)
              }}
            />
          ))}
        </View>
      )}
    </View>
  )
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