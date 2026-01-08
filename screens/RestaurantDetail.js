import { View, Text, Modal, ImageBackground, StyleSheet, Animated, TouchableOpacity, ScrollView, StatusBar, Platform } from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import About from '../components/restaurantDetail/About'
import { Divider } from 'react-native-elements'
import MenuItems from '../components/restaurantDetail/MenuItems'
import ViewCart from '../components/restaurantDetail/ViewCart'
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import grey1 from '../global'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Icon } from 'react-native-elements';
import { ArrowBack } from '../components/restaurantDetail/About'
import MapView, { Marker, PROVIDER_GOOGLE, } from 'react-native-maps'
import MapViewDirections from 'react-native-maps-directions';
import Loader from './Loader'
import { CustomMarker, DisplayMapviewDirections } from './OrderRequest'
import { apikey } from '../global'
import DisplayMapview from '../components/DisplayMapview'
import HeaderTabs from '../components/home/HeaderTabs'
import GroupFoodHeader from '../components/GroupFoodHeader'
import RestaurantDetailHeader from '../components/restaurantDetail/RestaurantDetailHeader'
import { LoaderContext } from "../contexts/LoaderContext"




export default function RestaurantDetail({ route, navigation }) {

  const { restaurant } = route.params

  const { image } = restaurant;

  const bottomSheet = useRef(null)
  const mapRef = useRef(null)

  const [userLocation, setUserLocation] = useState(null)

  const { loading, setLoading } = useContext(LoaderContext)

  const value = useState(new Animated.ValueXY({ x: 0, y: 0 }))[0]

  const value1 = useState(new Animated.ValueXY({ x: 0, y: 0 }))[0]

  const [activeTab, setActiveTab] = useState("Delivery")

  const [categoriesFood, setCategoriesFood] = useState(false)

  const _scrollView = useRef(null)
  const view = useRef(null)


  const foodsRef = useRef(null)

  const [scrollEnabled, setScrollEnabled] = useState(false)

  const value3 = useState(new Animated.Value(0))[0]


  const opacity = async (val) => {

    console.log("sdg")
    Animated.timing(value3, {
      toValue: val,
      duration: 1000,
      useNativeDriver: false
    }).start()
  }


  function pickup() {


    Animated.timing(value, {
      toValue: { x: 0, y: 205 },
      duration: 1000,
      useNativeDriver: true
    }).start()

    Animated.timing(value1, {
      toValue: { x: 0, y: -205 },
      duration: 1000,
      useNativeDriver: true
    }).start()

  }

  function delivery() {
    Animated.timing(value, {
      toValue: { x: 0, y: 0 },
      duration: 1000,
      useNativeDriver: true
    }).start()


    Animated.timing(value1, {
      toValue: { x: 0, y: 0 },
      duration: 1000,
      useNativeDriver: true
    }).start()
  }


  const scrollTo = (n) => {

    foodsRef.current[n].measure((fx, fy, w, h, px, py) => {
      console.log(py, h)

      _scrollView.current?.scrollTo({
        y: py,
        animated: true
      })
    })

  }

  useEffect(() => {


    AsyncStorage.getItem("userData").then(value => {
      let user = JSON.parse(value)
      setUserLocation({
        latitude: user.lat,
        longitude: user.lng
      })
    })

  }, [])


  if (!userLocation)
    return <Loader />




  return (
    <>
      <View style={{ flex: 1 }}>




        <View style={{ position: "absolute", top: Platform.OS === "android" ? StatusBar.currentHeight : 0, zIndex: 1 }}>
          <ArrowBack navigation={navigation} />
        </View>



        <Animated.View style={value.getTranslateTransform()}>
          <RestaurantImage image={image} navigation={navigation} />
        </Animated.View>

        <Divider width={5} color="white" style={{}} />

        <Animated.View style={value1.getTranslateTransform()}>
          < DisplayMapview userLocation={userLocation} mapRef={mapRef} apikey={apikey} restaurant={restaurant} />
        </Animated.View>




        <BottomSheet ref={bottomSheet} index={1} snapPoints={["47%", "75%", "100%"]}
          handleIndicatorStyle={{ backgroundColor: "#d9d9d9", width: 100 }}
          onChange={(index) => {
            if (index === 2) {
              setCategoriesFood(true)

              opacity(1).then(() => {
                setScrollEnabled(true)
              })

            }
            if (index === 0) {
            }

          }}

        >


          <MenuItems foodsRef={foodsRef} route={route} navigation={navigation} userLocation={userLocation}
            mapRef={mapRef} apikey={apikey} activeTab={activeTab}
            pickup={pickup} delivery={delivery} setActiveTab={setActiveTab}
            scrollEnabled={scrollEnabled} setScrollEnabled={setScrollEnabled}
            opacity={opacity} setCategoriesFood={setCategoriesFood}
          />

        </BottomSheet>
        <ViewCart navigation={navigation} route={route} />


      </View>
      {loading && <Modal
        animationType='slide'
        visible={loading}
        transparent={true}
        onRequestClose={() => setLoading(false)}
      >
        <Loader />
      </Modal>}
    </>
  )
}



const RestaurantImage = (props) => (

  <ImageBackground

    style={styles.container}
    source={{ uri: props.image }}
  >
    <View style={{ paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0, }}>
    </View>



  </ImageBackground>


);

const DisplayPolylines = () => {

}


const styles = StyleSheet.create({

  container: {
    width: "100%",
    height: 200,
  },

})