import { View, Text, ImageBackground, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Platform, Dimensions, Linking } from 'react-native'
import React, { useContext, useEffect, useRef, useState, useMemo } from 'react'
import { Icon, Divider } from 'react-native-elements'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LoaderContext } from "../contexts/LoaderContext"
import Loader from './Loader'
import MenuItems from '../components/restaurantDetail/MenuItems'
import ViewCart from '../components/restaurantDetail/ViewCart'
import HeaderTabs from '../components/home/HeaderTabs'
import ReviewCard from '../components/restaurantDetail/ReviewCard'
import RestaurantDetailComponent from '../components/RestaurantDetailComponent'
import { colors, currency, language } from '../global'
import { config } from '../config'
import { getDistanceFromLatLonInKm, getRestaurantDeliveryTime, location } from '../utils'
import * as Location from 'expo-location'
import { getRestaurantReviews, getDeliverySettings, getFavorites, addToFavorites, removeFromFavorites } from '../api'

const { width, height } = Dimensions.get('window')

export default function RestaurantDetail({ route, navigation }) {
  const { restaurant } = route.params
  const { image } = restaurant

  // console.log('🔍 DEBUG RestaurantDetail - CONFIG:', config)
  // console.log('🔍 DEBUG RestaurantDetail - DEMO_MODE:', config?.DEMO_MODE)
  // console.log('🔍 DEBUG RestaurantDetail - restaurant:', restaurant)

  const scrollViewRef = useRef(null)

  const [userLocation, setUserLocation] = useState(null)
  const [activeTab, setActiveTab] = useState("Delivery")
  const [categoriesFood, setCategoriesFood] = useState(false)
  const [scrollEnabled, setScrollEnabled] = useState(true)
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [deliverySettings, setDeliverySettings] = useState(null)
  const [userFavorites, setUserFavorites] = useState([])
  const [restaurantDetailVisible, setRestaurantDetailVisible] = useState(false)

  const foodsRef = useRef(null)
  const { loading, setLoading } = useContext(LoaderContext)

  useEffect(() => {
    // Charger les données utilisateur depuis l'API (pas de cache)
    const loadUserData = async () => {
      try {
        // Pour l'instant on garde AsyncStorage pour userData car c'est pour la session
        // TODO: Remplacer par un vrai système de session/token
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const user = JSON.parse(userData);
          setUserLocation({
            latitude: user.lat,
            longitude: user.lng
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();

    // Charger les paramètres de livraison directement depuis l'API
    console.log('🔥 LOADING DELIVERY SETTINGS from API...')
    getDeliverySettings().then(settings => {
      console.log('🔥 DELIVERY SETTINGS LOADED:', settings)
      setDeliverySettings(settings);
    }).catch(error => {
      console.error('Error loading delivery settings:', error);
      // Valeurs par défaut en cas d'erreur
      console.log('🔥 USING FALLBACK DELIVERY SETTINGS')
      setDeliverySettings({
        fixedDeliveryFee: 2.5,
        dynamicDeliveryFee: { baseFee: 1.5, perKmFee: 0.5, minFee: 1.5, maxFee: 10 },
        freeDeliveryThreshold: 25,
        deliveryFeeType: 'FIXED'
      });
    });

    // Charger les favoris de l'utilisateur directement depuis l'API
    getFavorites().then(response => {
      if (response.success && response.favorites) {
        const favoriteIds = response.favorites.map(fav => fav._id || fav.id);
        setUserFavorites(favoriteIds);
      }
    }).catch(error => {
      console.error('Error loading favorites:', error);
      setUserFavorites([]); // Favoris vides par défaut
    });
  }, [])

  // Charger les avis du restaurant
  useEffect(() => {
    const loadReviews = async () => {
      const restaurantId = restaurant.restaurantId || restaurant.id || restaurant._id;
      if (!restaurantId) return;

      setLoadingReviews(true);
      try {
        const reviewsData = await getRestaurantReviews(restaurantId);
        // Limiter à 3 avis récents pour l'affichage
        setReviews(reviewsData.slice(0, 3) || []);
      } catch (error) {
        console.error('Error loading reviews:', error);
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    loadReviews();
  }, [restaurant])

  // Obtenir la position GPS de l'utilisateur (uniquement en mode normal)
  useEffect(() => {
    // En mode démo, pas besoin de GPS - utiliser les valeurs statiques
    if (config.DEMO_MODE) {
      return;
    }

    const getUserLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission de localisation refusée');
          return;
        }

        let locationResult = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: locationResult.coords.latitude,
          longitude: locationResult.coords.longitude,
        });
      } catch (error) {
        console.warn('Erreur obtention position GPS:', error);
        // Garder la valeur par défaut
      }
    };

    getUserLocation();
  }, [])

  // Calcul de la distance
  const distance = useMemo(() => {
    if (!userLocation || !restaurant.latitude || !restaurant.longitude) return null;
    const lat1 = parseFloat(userLocation.latitude);
    const lon1 = parseFloat(userLocation.longitude);
    const lat2 = parseFloat(restaurant.latitude);
    const lon2 = parseFloat(restaurant.longitude);

    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return null;

    return getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2);
  }, [userLocation, restaurant.latitude, restaurant.longitude]);

  // Calcul du temps de livraison estimé basé sur la distance
  const deliveryTime = useMemo(() => {
    console.log('🔥 DELIVERY TIME - DEMO_MODE:', config.DEMO_MODE)
    console.log('🔥 DELIVERY TIME - userLocation:', !!userLocation)

    // MODE DÉMO : valeurs basées sur le temps de préparation du restaurant
    if (config.DEMO_MODE) {
      const prepTime = parseInt(restaurant.collectTime) || 25;
      const result = {
        min: prepTime + 10,  // 10 min supplémentaires pour la livraison
        max: prepTime + 20,  // 20 min max pour la livraison
        distance: 0  // Pas de distance en mode démo
      };
      console.log('🔥 DELIVERY TIME - RESULT (DEMO):', result)
      return result;
    }

    // MODE NORMAL : calcul basé sur la distance GPS
    if (userLocation) {
      const result = getRestaurantDeliveryTime(restaurant, userLocation);
      console.log('🔥 DELIVERY TIME - RESULT (GPS):', result)
      return result;
    }

    // Valeur par défaut si pas de position utilisateur
    const result = { min: 25, max: 35, distance: 0 };
    console.log('🔥 DELIVERY TIME - RESULT (DEFAULT):', result)
    return result;
  }, [userLocation, restaurant.latitude, restaurant.longitude, restaurant.collectTime]);

  // Calcul des frais de livraison basé sur les paramètres DB
  const deliveryFee = useMemo(() => {
    console.log('🔥 CALCULATING DELIVERY FEE:', { deliverySettings, distance })

    if (!deliverySettings) {
      console.log('🔥 NO DELIVERY SETTINGS - USING DEFAULT: 2.50')
      return '2.50'; // Valeur par défaut pendant le chargement
    }

    if (deliverySettings.deliveryFeeType === 'FIXED') {
      const fee = deliverySettings.fixedDeliveryFee?.toFixed(2) || '2.50';
      console.log('🔥 FIXED DELIVERY FEE:', fee)
      return fee;
    }

    if (deliverySettings.deliveryFeeType === 'DYNAMIC' && distance) {
      const { baseFee, perKmFee, minFee, maxFee } = deliverySettings.dynamicDeliveryFee || {};
      const calculatedFee = (baseFee || 1.5) + (distance * (perKmFee || 0.5));
      const fee = Math.min(Math.max(calculatedFee, minFee || 1.5), maxFee || 10);
      const result = fee.toFixed(2);
      console.log('🔥 DYNAMIC DELIVERY FEE:', { calculatedFee, minFee, maxFee, result })
      return result;
    }

    if (deliverySettings.deliveryFeeType === 'FREE') {
      console.log('🔥 FREE DELIVERY')
      return '0.00';
    }

    // Valeur par défaut
    const fee = deliverySettings.fixedDeliveryFee?.toFixed(2) || '2.50';
    console.log('🔥 DEFAULT DELIVERY FEE:', fee)
    return fee;
  }, [distance, deliverySettings]);

  // Fonction pour vérifier si le restaurant est ouvert
  const getRestaurantStatus = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute; // Minutes depuis minuit

    const openingTime = restaurant.openingTime || "09:00";
    const closingTime = restaurant.closingTime || "21:00";

    const [openHour, openMin] = openingTime.split(':').map(Number);
    const [closeHour, closeMin] = closingTime.split(':').map(Number);

    const openTimeMinutes = openHour * 60 + openMin;
    const closeTimeMinutes = closeHour * 60 + closeMin;

    const isOpen = currentTime >= openTimeMinutes && currentTime < closeTimeMinutes;

    // Formater l'heure de fermeture
    const formatTime = (hour, min) => {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${min.toString().padStart(2, '0')} ${period}`;
    };

    return {
      isOpen,
      statusText: isOpen
        ? `Open until ${formatTime(closeHour, closeMin)}`
        : `Closed • Opens at ${formatTime(openHour, openMin)}`,
      statusColor: isOpen ? colors.success : colors.error,
      statusIcon: isOpen ? 'check-circle' : 'close-circle'
    };
  }, [restaurant.openingTime, restaurant.closingTime]);

  if (!userLocation) return <Loader />

  // Nettoyage des données pour l'affichage
  const formattedRating = restaurant.rating ? parseFloat(restaurant.rating).toFixed(1) : "4.5";
  const price = restaurant.price || "$$";

  // Extraire les catégories du restaurant
  const categoriesText = restaurant.categories && restaurant.categories.length > 0
    ? restaurant.categories.map(cat => cat.title || cat.name).join(' • ')
    : 'Restaurant';

  // Logique des favoris
  const restaurantId = restaurant.restaurantId || restaurant.id || restaurant._id;
  const isFavorite = userFavorites.includes(restaurantId);

  // Fonction pour basculer les favoris
  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await removeFromFavorites(restaurantId);
        setUserFavorites(prev => prev.filter(id => id !== restaurantId));
      } else {
        await addToFavorites(restaurantId);
        setUserFavorites(prev => [...prev, restaurantId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Fonction pour ouvrir les directions
  const openDirections = () => {
    const lat = restaurant.latitude;
    const lng = restaurant.longitude;
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(restaurant.name)})`,
    });
    Linking.openURL(url).catch(err => console.error('Error opening directions:', err));
  };

  // Fonction pour appeler le restaurant
  const callRestaurant = () => {
    const phoneNumber = restaurant.phone || restaurant.display_phone;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`).catch(err => console.error('Error calling:', err));
    }
  };

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

          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={toggleFavorite}
            activeOpacity={0.7}
          >
            <Icon
              name={isFavorite ? "heart" : "heart-outline"}
              type="material-community"
              color={isFavorite ? "#FF6B6B" : "white"}
              size={24}
            />
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
          <TouchableOpacity style={styles.infoSection} onPress={() => setRestaurantDetailVisible(true)} activeOpacity={0.7}>
            <Text style={styles.restaurantTitle}>{restaurant.name}</Text>
            
            <View style={styles.ratingRow}>
              <View style={styles.ratingBadge}>
                <Icon name="star" type="material-community" color={colors.accent} size={16} />
                <Text style={styles.ratingText}>{formattedRating}</Text>
              </View>
              <Text style={styles.categoriesText}>{categoriesText}</Text>
              <Text style={styles.priceText}>{price}</Text>
            </View>

            <View style={styles.statusRow}>
              <Icon
                name={getRestaurantStatus.statusIcon}
                type="material-community"
                color={getRestaurantStatus.statusColor}
                size={16}
              />
              <Text style={[styles.statusText, { color: getRestaurantStatus.statusColor }]}>
                {getRestaurantStatus.statusText}
              </Text>
            </View>


            {/* Informations restaurant (adresse et téléphone) */}
            {(restaurant.address || restaurant.phone) && (
              <View style={styles.restaurantInfoRow}>
                {restaurant.address && (
                  <TouchableOpacity 
                    style={styles.infoButton}
                    onPress={openDirections}
                  >
                    <Icon name="map-marker" type="material-community" color={colors.primary} size={18} />
                    <Text style={styles.infoButtonText} numberOfLines={1}>
                      {restaurant.address}
                    </Text>
                    <Icon name="chevron-right" type="material-community" color={colors.text.secondary} size={18} />
                  </TouchableOpacity>
                )}
                {restaurant.phone && (
                  <TouchableOpacity 
                    style={styles.infoButton}
                    onPress={callRestaurant}
                  >
                    <Icon name="phone" type="material-community" color={colors.primary} size={18} />
                    <Text style={styles.infoButtonText}>{restaurant.display_phone || restaurant.phone}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </TouchableOpacity>

          <Divider width={1} color={colors.divider} style={{ marginHorizontal: 20 }} />

          {/* Section Avis */}
          {reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <View style={styles.reviewsHeader}>
                <Text style={styles.reviewsTitle}>Recent Reviews</Text>
                {/* TODO: Implement ReviewsScreen - See all button disabled */}
              </View>
              {reviews.map((review, index) => (
                <ReviewCard key={review._id || review.id || index} review={review} />
              ))}
            </View>
          )}

          <Divider width={1} color={colors.divider} style={{ marginHorizontal: 20, marginTop: reviews.length > 0 ? 10 : 0 }} />

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


          {/* Menu Items List */}
          <View style={styles.menuList}>
            <MenuItems
              foodsRef={foodsRef}
              route={route}
              restaurant={restaurant}
              navigation={navigation}
              userLocation={userLocation}
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

      {/* Restaurant Detail Modal */}
      <RestaurantDetailComponent
        restaurant={restaurant}
        visible={restaurantDetailVisible}
        setVisible={setRestaurantDetailVisible}
        deliveryTime={deliveryTime}
        deliveryFee={deliveryFee}
        distance={distance}
      />
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
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteHeaderButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteHeaderButtonActive: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
  },
  categoriesText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 12,
    flex: 1,
  },
  priceText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginRight: 16,
  },
  deliveryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginHorizontal: 0,
  },
  deliveryInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  restaurantInfoRow: {
    marginTop: 12,
    gap: 8,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    gap: 8,
  },
  infoButtonText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.primary,
    marginLeft: 4,
  },
  reviewsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
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