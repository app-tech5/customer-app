import { View, Text, useWindowDimensions, Image, ScrollView, Animated, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native'
import React, { useContext, useEffect, useRef, useState, useCallback } from 'react'
import MapView, { Callout, Marker } from 'react-native-maps'
import RestaurantItems from '../components/home/RestaurantItems'
import LottieView from 'lottie-react-native'
import { RestaurantInfo, RestaurantImage } from '../components/home/RestaurantItems'
import { location } from '../global'
import { MaterialIcons } from '@expo/vector-icons';
import SearchBar from '../components/home/SearchBar'
import BottomSheet from '@gorhom/bottom-sheet'
import Categories from '../components/home/Categories'
import { FlatList } from 'react-native-gesture-handler'
import Reward from '../components/Reward'
import { getDistanceFromLatLonInKm } from '../utils'
import { Icon } from 'react-native-elements'
import { RestaurantsContext } from '../contexts/RestaurantsContext'
import { useSelector } from 'react-redux'


export default function RestaurantsMapScreen({ route, navigation }) {
  const { restaurantData } = useContext(RestaurantsContext)
  const {lat,lng} = useSelector((state)=>state.userReducer)
  const { width, height } = useWindowDimensions();
  const _map = useRef(null)
  const restaurantsRef = useRef(null)
  const [visible, setVisible] = useState(route.params?.visible ?? false)
  const [scrollEnabled, setScrollEnabled] = useState(false)
  const [offset, setOffset] = useState(0)
  const [direction, setDirection] = useState("")
  const [focus, setFocus] = useState(new Array(restaurantData?.length || 0).fill({
    backgroundColor: "white",
    color: "black",
    zIndex: 1,
  }))
  const setFocusFunction = async (index) => {
    setFocus([...Array(index).fill({
      backgroundColor: "white",
      color: "black",
      zIndex: 1
    }), {
      backgroundColor: "black",
      color: "white",
      zIndex: 1000
    }, ...Array(focus.length - index).fill({
      backgroundColor: "white",
      color: "black",
      zIndex: 1
    })])
  }

  // Vérifier que les données sont chargées
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
          latitude: lat || restaurantData[0]?.lat || 48.8566, // Paris par défaut
          longitude: lng || restaurantData[0]?.lng || 2.3522, // Paris par défaut
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421
        }}
        style={{
          height: height,
          width: width
        }}
      >
        <RestaurantMarkers restaurantData={restaurantData} focus={focus} setFocusFunction={setFocusFunction} restaurantsRef={restaurantsRef}
          visible={visible} setVisible={setVisible} />
      </MapView>
      <View style={{ ...styles.header, width: width, }}>
        <TouchableOpacity
          style={styles.arrowBack}
          onPress={() => navigation.navigate('Home')}
        >
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.searchbar}>
          <SearchBar />
        </View>
      </View>
      {visible && <BottomSheet index={1} snapPoints={["20%", "40%", "95%"]}
        handleIndicatorStyle={{ backgroundColor: "#d9d9d9", width: 100 }}
        onChange={(index) => {
          if (index === 2) {
            setScrollEnabled(true)
          }
          if (index === 0) {
          }
        }}
      >
        <RestaurantsView restaurantsRef={restaurantsRef} restaurantData={restaurantData} setFocusFunction={setFocusFunction}
          focus={focus} _map={_map} width={width} horizontal={false} Categories={Categories} scrollEnabled={scrollEnabled}
          setDirection={setDirection} setOffset={setOffset} offset={offset} direction={direction}
          setScrollEnabled={setScrollEnabled} navigation={navigation}/>
      </BottomSheet>}
      {!visible && <RestaurantsView restaurantsRef={restaurantsRef} restaurantData={restaurantData} setFocusFunction={setFocusFunction}
        focus={focus} _map={_map} width={width} horizontal={true} setVisible={setVisible} navigation={navigation}/>}
    </View>
  )
}
const RestaurantsView = ({ _map, restaurantsRef, restaurantData, setFocusFunction, focus, width, horizontal,
  Categories, scrollEnabled, offset, setOffset, direction, setDirection, setScrollEnabled, setVisible, navigation}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeout = useRef(null)

  // Fonction utilitaire pour calculer l'index à partir du scroll
  const calculateIndexFromScroll = useCallback((scrollX, containerWidth) => {
    const itemWidth = containerWidth
    const rawIndex = scrollX / itemWidth
    return Math.max(0, Math.min(restaurantData.length - 1, Math.round(rawIndex)))
  }, [restaurantData.length])

  // Fonction utilitaire pour animer la carte vers un restaurant
  const animateMapToRestaurant = useCallback((restaurant, delay = 0) => {
    if (restaurant && restaurant.lat && restaurant.lng) {
      // Clear any existing animation timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }

      scrollTimeout.current = setTimeout(() => {
        _map.current?.animateToRegion({
          latitude: parseFloat(restaurant.lat),
          longitude: parseFloat(restaurant.lng),
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421
        }, 300)
        scrollTimeout.current = null
      }, delay)
    }
  }, [_map])

  // Cleanup timeout on unmount
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
        data={restaurantData}
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
        snapToInterval={horizontal ? width * 0.85 + 16 : undefined} // 16 pour les marges
        decelerationRate={horizontal ? "fast" : "normal"}
        onScrollBeginDrag={horizontal ? () => {
          setIsScrolling(true)
          // Clear any pending timeout
          if (scrollTimeout.current) {
            clearTimeout(scrollTimeout.current)
          }
        } : undefined}
        onScrollEndDrag={horizontal ? (event) => {
          // Délai pour laisser le momentum finir
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

          // Animation finale de la carte
          const restaurant = restaurantData[finalIndex]
          animateMapToRestaurant(restaurant, 0)

          setFocusFunction(finalIndex)
        } : () => { }}
        onScroll={horizontal ? (event) => {
          const { contentOffset, layoutMeasurement } = event.nativeEvent
          const scrollX = contentOffset.x
          const containerWidth = layoutMeasurement.width || width * 0.85

          const newIndex = calculateIndexFromScroll(scrollX, containerWidth)

          // Mettre à jour l'index seulement si différent et pas en train de scroller
          if (newIndex !== currentIndex && !isScrolling) {
            setCurrentIndex(newIndex)

            // Animation de la carte avec délai pour éviter les conflits
            const restaurant = restaurantData[newIndex]
            animateMapToRestaurant(restaurant, 50)

            setFocusFunction(newIndex)
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
                // Navigation fluide vers l'index sélectionné
                setCurrentIndex(index)
                restaurantsRef.current?.scrollToIndex({
                  index,
                  animated: true,
                  viewPosition: 0.5 // Centrer l'élément
                })

                // Animation de la carte synchronisée avec le scroll
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
const RestaurantMarkers = ({ restaurantData, focus, setFocusFunction, restaurantsRef, visible, setVisible }) => {
  return restaurantData.map((restaurant, index) => {
    const lat = restaurant.latitude || restaurant.lat
    const lng = restaurant.longitude || restaurant.lng

    if (!lat || !lng) return null

    const focusStyle = focus[index] || { backgroundColor: "white", color: "black", zIndex: 1 }

    return (
      <Marker
        key={`marker-${index}`}
        coordinate={{
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
        }}
        title={restaurant.name || "Restaurant"}
        description="Test marker"
        onPress={() => {
          if (visible) setVisible(false)
          setTimeout(() => {
            setFocusFunction(index)
            restaurantsRef.current?.scrollToIndex({
              index: index,
              animated: true,
              viewPosition: 0.5
            })
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
        <Text style={{ fontWeight: "bold" }}>List</Text>
      </View>
    </View>
  )
}
const styles = StyleSheet.create({
  header: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    paddingBottom: 10,
    zIndex: 1
  },
  arrowBack: {
    padding: 10,
    marginLeft: 5,
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
    paddingLeft: 20, // Pour centrer le premier élément
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