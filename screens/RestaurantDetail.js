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
import { getDistanceFromLatLonInKm } from '../utils'
import { getRestaurantReviews, getDeliverySettings, getFavorites, addToFavorites, removeFromFavorites } from '../api'

const { width, height } = Dimensions.get('window')

export default function RestaurantDetail({ route, navigation }) {
  const { restaurant } = route.params
  const { image } = restaurant

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
    getDeliverySettings().then(settings => {
      setDeliverySettings(settings);
    }).catch(error => {
      console.error('Error loading delivery settings:', error);
      // Valeurs par défaut en cas d'erreur
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

  // Calcul du temps de livraison estimé
  const estimatedDeliveryTime = useMemo(() => {
    const prepTime = restaurant.collectTime || 25; // Temps de préparation par défaut
    const transportTime = distance ? Math.ceil(distance * 2) : 10; // ~2 min par km
    return prepTime + transportTime;
  }, [restaurant.collectTime, distance]);

  // Calcul des frais de livraison basé sur les paramètres DB
  const deliveryFee = useMemo(() => {
    if (!deliverySettings) return '2.50'; // Valeur par défaut pendant le chargement

    if (deliverySettings.deliveryFeeType === 'FIXED') {
      return deliverySettings.fixedDeliveryFee?.toFixed(2) || '2.50';
    }

    if (deliverySettings.deliveryFeeType === 'DYNAMIC' && distance) {
      const { baseFee, perKmFee, minFee, maxFee } = deliverySettings.dynamicDeliveryFee || {};
      const calculatedFee = (baseFee || 1.5) + (distance * (perKmFee || 0.5));
      const fee = Math.min(Math.max(calculatedFee, minFee || 1.5), maxFee || 10);
      return fee.toFixed(2);
    }

    if (deliverySettings.deliveryFeeType === 'FREE') {
      return '0.00';
    }

    // Valeur par défaut
    return deliverySettings.fixedDeliveryFee?.toFixed(2) || '2.50';
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
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={toggleFavorite}
                activeOpacity={0.7}
              >
                <Icon
                  name={isFavorite ? "heart" : "heart-outline"}
                  type="material-community"
                  color={isFavorite ? "#FF6B6B" : colors.text.secondary}
                  size={24}
                />
              </TouchableOpacity>
            </View>

            {/* Informations de livraison */}
            {activeTab === "Delivery" && distance !== null && (
              <View style={styles.deliveryInfoRow}>
                <View style={styles.deliveryInfoItem}>
                  <Icon name="map-marker-distance" type="material-community" color={colors.info} size={18} />
                  <Text style={styles.deliveryInfoText}>{distance.toFixed(1)} km</Text>
                </View>
                <View style={styles.deliveryInfoItem}>
                  <Icon name="clock-outline" type="material-community" color={colors.info} size={18} />
                  <Text style={styles.deliveryInfoText}>{estimatedDeliveryTime} min</Text>
                </View>
                <View style={styles.deliveryInfoItem}>
                  <Icon name="currency-usd" type="material-community" color={colors.info} size={18} />
                  <Text style={styles.deliveryInfoText}>
                    {Number(deliveryFee).toLocaleString(language, {
                      style: "currency",
                      currency: currency
                    })}
                  </Text>
                </View>
              </View>
            )}

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
                <TouchableOpacity 
                  onPress={() => navigation.navigate('ReviewsScreen', { restaurant })}
                >
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
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
  favoriteButton: {
    padding: 8,
    marginLeft: 8,
  },
  categoriesText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 12,
    flex: 1,
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