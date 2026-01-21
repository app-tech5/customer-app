import { View, Text, useWindowDimensions, Image, ScrollView, Animated, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import MapView, { Callout, Marker } from 'react-native-maps'
import RestaurantItems from '../components/home/RestaurantItems'
import LottieView from 'lottie-react-native'
import { RestaurantInfo, RestaurantImage } from '../components/home/RestaurantItems'
import { location } from '../global'
import { MaterialIcons } from '@expo/vector-icons';
import { ArrowBack } from '../components/restaurantDetail/About'
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
  if (!restaurantData || restaurantData.length === 0 || !lat || !lng) {
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
          latitude: lat,
          longitude: lng,
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
        <ArrowBack navigation={navigation} />
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
  return (
    <View style={horizontal ? styles.flatlist : {}}>
      {horizontal && <ListButton setVisible={setVisible} />}
      <FlatList
        ref={restaurantsRef}
        horizontal={horizontal}
        data={restaurantData}
        keyExtractor={(item, index) => index}
        renderItem={({ item, index }) => {
          return (
          <TouchableOpacity style={{...styles.restaurant,width: horizontal ? width * 0.9 : "auto",}}  onPress={()=>navigation.navigate("RestaurantDetail",
          {
            restaurant: item
          })}>
            <View style={{ ...styles.restaurantImage_restaurantInfo, paddingTop: horizontal ? 15 : "auto", paddingVertical: horizontal ? "auto" : 10 }}>
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
        onScroll={horizontal ? (event) => {
          let x = event.nativeEvent.contentOffset.x
          let w = event.nativeEvent.layoutMeasurement.width
          let index = Math.round(x / w)
          _map.current.animateToRegion({
            latitude: restaurantData[Math.round(x / w)].latitude,
            longitude: restaurantData[Math.round(x / w)].longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421
          })
          setFocusFunction(index)
        } : (event) => {
          setDirection(event.nativeEvent.contentOffset.y > offset ? 'up' : 'down')
          setOffset(event.nativeEvent.contentOffset.y)
          if (event.nativeEvent.contentOffset.y === 0 && direction === "down")
            setScrollEnabled(false)
        }}
        onMomentumScrollEnd={horizontal ? () => {
          restaurantsRef.current.scrollToIndex({
            animated: true,
            index: focus.findIndex((style) => style.backgroundColor === "black")
          })
        } : () => { }}
        ListHeaderComponent={!horizontal ? () => <View style={styles.categories}>
          <Categories />
        </View> : <></>}
      />
    </View>
  )
}
const RestaurantMarkers = ({ restaurantData, focus, setFocusFunction, restaurantsRef, visible, setVisible }) => {
  return restaurantData.map((restaurant, index) => {
    return (
      <Marker key={index} title={restaurant.name} description="nasso"
        coordinate={{
          latitude: restaurant.lat,
          longitude: restaurant.lng,
        }}
        onPress={() => {
          if (visible)
            setVisible(false)
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            setFocusFunction(index)
              .then(() => restaurantsRef.current.scrollToIndex({
                animated: true,
                index: index
              }))
          })
        }}
      >
        <View style={{ ...styles.restaurant_marker, backgroundColor: focus[index].backgroundColor, zIndex: focus[index].zIndex }}>
          <MaterialIcons style={styles.restaurant_marker_icon} name="restaurant" size={15} color={focus[index].color} />
        </View>
        <Callout tooltip>
          <View style={styles.bubble}>
            <RestaurantInfo
              name={restaurant.name}
              rating={restaurant.rating}
              city={restaurant.city} />
          </View>
        </Callout>
      </Marker>
    )
  })
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
    borderRadius: 50,
    position: "absolute",
    borderColor: '#ccc',
    borderWidth: 0.5,
  },
  restaurant_marker_shadow: {
    backgroundColor: "grey",
    top: 0, left: 0,
    width: 43, height: 43
  },
  restaurant_marker_icon: {
    padding: 10,
  },
  flatlist: {
    position: "absolute",
    bottom: 70
  },
  restaurantsContainer:
  {
    flexDirection: "row"
  },
  restaurant: {
    borderRadius: 10,
    backgroundColor: "white",
    marginHorizontal: 5,
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
  }
})