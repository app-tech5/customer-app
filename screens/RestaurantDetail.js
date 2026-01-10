import { View, Text, ImageBackground, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Platform, Dimensions } from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Icon, Divider } from 'react-native-elements'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LoaderContext } from "../contexts/LoaderContext"
import Loader from './Loader'
import MenuItems from '../components/restaurantDetail/MenuItems'
import ViewCart from '../components/restaurantDetail/ViewCart'
import HeaderTabs from '../components/home/HeaderTabs'
import DisplayMapview from '../components/DisplayMapview'
import { apikey, colors } from '../global'

const { width, height } = Dimensions.get('window')

export default function RestaurantDetail({ route, navigation }) {
  const { restaurant } = route.params
  const { image } = restaurant

  const scrollViewRef = useRef(null)
  const mapRef = useRef(null)

  const [userLocation, setUserLocation] = useState(null)
  const [activeTab, setActiveTab] = useState("Delivery")
  const [categoriesFood, setCategoriesFood] = useState(false)
  const [scrollEnabled, setScrollEnabled] = useState(true)

  const foodsRef = useRef(null)
  const { loading, setLoading } = useContext(LoaderContext)

  useEffect(() => {
    AsyncStorage.getItem("userData").then(value => {
      if (value) {
        let user = JSON.parse(value)
        setUserLocation({
          latitude: user.lat,
          longitude: user.lng
        })
      }
    })
  }, [])

  if (!userLocation) return <Loader />

  // Nettoyage des données pour l'affichage
  const formattedRating = restaurant.rating ? parseFloat(restaurant.rating).toFixed(1) : "4.5";
  const reviewCount = restaurant.review_count || "150";
  const price = restaurant.price || "$$";
  
  // Extraire le nom de la catégorie (Pizza, Burger, etc.)
  const categoryName = restaurant.categories?.[0]?.title || restaurant.categories?.[0]?.name || "Restaurant";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* 1. Header Image Section */}
      <ImageBackground
        source={{ uri: image }}
        style={styles.headerImage}
      >
        <View style={styles.headerOverlay}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" type="material-community" color="white" size={26} />
          </TouchableOpacity>
        </View>
      </ImageBackground>

      {/* 2. Main Content Card */}
      <View style={styles.contentCard}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Restaurant Basic Info */}
          <View style={styles.infoSection}>
            <Text style={styles.restaurantTitle}>{restaurant.name}</Text>
            
            <View style={styles.ratingRow}>
              <View style={styles.ratingBadge}>
                <Icon name="star" type="material-community" color={colors.accent} size={16} />
                <Text style={styles.ratingText}>{formattedRating}</Text>
              </View>
              <Text style={styles.infoText}>{reviewCount}+ ratings</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.infoText}>{categoryName}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.infoText}>{price}</Text>
            </View>

            <View style={styles.statusRow}>
              <Icon name="clock-outline" type="material-community" color={colors.success} size={16} />
              <Text style={styles.statusText}>Open until 2:00 AM</Text>
            </View>
          </View>

          <Divider width={1} color={colors.divider} style={{ marginHorizontal: 20 }} />

          {/* Service Mode Tabs */}
          <View style={styles.tabsWrapper}>
            <HeaderTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              navigation={null} 
              restaurantData={[restaurant]}
              setCity={() => {}}
              searchbar={null}
              pickup={() => setActiveTab("Pickup")}
              delivery={() => setActiveTab("Delivery")}
            />
          </View>

          {/* Map Integration */}
          <View style={styles.mapWrapper}>
            <DisplayMapview
              userLocation={userLocation}
              mapRef={mapRef}
              apikey={apikey}
              restaurant={restaurant}
              height={150}
            />
          </View>

          {/* Menu Items List */}
          <View style={styles.menuList}>
            <MenuItems
              foodsRef={foodsRef}
              route={route}
              restaurant={restaurant}
              navigation={navigation}
              userLocation={userLocation}
              mapRef={mapRef}
              apikey={apikey}
              activeTab={activeTab}
              pickup={() => setActiveTab("Pickup")}
              delivery={() => setActiveTab("Delivery")}
              setActiveTab={setActiveTab}
              scrollEnabled={false}
              setScrollEnabled={setScrollEnabled}
              opacity={async () => {}}
              setCategoriesFood={setCategoriesFood}
              hideHeader={true}
            />
          </View>
        </ScrollView>
      </View>

      {/* 3. Sticky Bottom Cart Button */}
      <View style={styles.cartContainer}>
        <ViewCart navigation={navigation} route={route} />
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loaderOverlay}>
          <Loader />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Pour que l'image soit bien détourée
  },
  headerImage: {
    width: '100%',
    height: height * 0.3,
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingLeft: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentCard: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
  },
  restaurantTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.rating,
    marginLeft: 4,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  dot: {
    marginHorizontal: 8,
    color: colors.border.medium,
    fontSize: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
    marginLeft: 6,
  },
  tabsWrapper: {
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  mapWrapper: {
    marginHorizontal: 20,
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.divider,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  menuList: {
    flex: 1,
  },
  cartContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    zIndex: 100,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
})