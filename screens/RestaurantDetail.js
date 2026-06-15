import { View, Text, ImageBackground, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Platform, Dimensions, Linking } from 'react-native'
import React, { useContext, useEffect, useRef, useState, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { Icon, Divider } from 'react-native-elements'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LoaderContext } from "../contexts/LoaderContext"
import Loader from './Loader'
import MenuItems from '../components/restaurantDetail/MenuItems'
import ViewCart from '../components/restaurantDetail/ViewCart'
import HeaderTabs from '../components/home/HeaderTabs'
import ReviewCard from '../components/restaurantDetail/ReviewCard'
import PromotionCard from '../components/restaurantDetail/PromotionCard'
import RestaurantDetailComponent from '../components/RestaurantDetailComponent'
import { colors, formatRestaurantRatingDisplay } from '../global'
import { config } from '../config'
import { getRestaurantDeliveryTime } from '../utils'
import * as Location from 'expo-location'
import {
  getRestaurantReviews,
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  getRestaurantPromotions,
  getRestaurantDeliverySettings,
  getRestaurantMongoId,
} from '../api'
import i18n from '../lang/i18n'

const { width, height } = Dimensions.get('window')

export default function RestaurantDetail({ route, navigation }) {
  const { restaurant } = route.params
  const { image } = restaurant
  const dispatch = useDispatch()

  const scrollViewRef = useRef(null)

  const [userLocation, setUserLocation] = useState(null)
  const [activeTab, setActiveTab] = useState("Delivery")
  const [categoriesFood, setCategoriesFood] = useState(false)
  const [scrollEnabled, setScrollEnabled] = useState(true)
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [userFavorites, setUserFavorites] = useState([])
  const [restaurantDetailVisible, setRestaurantDetailVisible] = useState(false)
  const [promotions, setPromotions] = useState([])
  const [loadingPromotions, setLoadingPromotions] = useState(false)
  const [deliverySetting, setDeliverySetting] = useState(null)

  const foodsRef = useRef(null)
  const { loading, setLoading } = useContext(LoaderContext)

  useEffect(() => {
    
    const loadUserData = async () => {
      try {
        
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const user = JSON.parse(userData);
          if (user.location?.latitude != null && user.location?.longitude != null) {
            setUserLocation({
              latitude: user.location.latitude,
              longitude: user.location.longitude,
            });
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
    
    getFavorites().then(response => {
      if (response.success && response.favorites) {
        const favoriteIds = response.favorites.map(fav => fav._id || fav.id);
        setUserFavorites(favoriteIds);
        dispatch({ type: 'SET_FAVORITES', payload: favoriteIds });
      }
    }).catch(error => {
      console.error('Error loading favorites:', error);
      setUserFavorites([]);
      dispatch({ type: 'SET_FAVORITES', payload: [] });
    });
  }, [])
  
  useEffect(() => {
    const loadReviews = async () => {
      const restaurantId = getRestaurantMongoId(restaurant);
      if (!restaurantId) return;

      setLoadingReviews(true);
      try {
        const reviewsData = await getRestaurantReviews(restaurantId);
        
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
  
  useEffect(() => {
    const loadPromotions = async () => {
      const restaurantId = getRestaurantMongoId(restaurant);
      if (!restaurantId) return;

      setLoadingPromotions(true);
      try {
        const promotionsData = await getRestaurantPromotions(restaurantId);
        console.warn('🔥 PROMOTIONS LOADED for restaurant', restaurantId, ':', promotionsData.length);
        setPromotions(promotionsData);
      } catch (error) {
        console.error('Error loading promotions:', error);
        setPromotions([]);
      } finally {
        setLoadingPromotions(false);
      }
    };

    loadPromotions();
  }, [restaurant])

  useEffect(() => {
    const restaurantId = getRestaurantMongoId(restaurant);
    if (!restaurantId) {
      setDeliverySetting(null);
      return undefined;
    }
    let cancelled = false;
    setDeliverySetting(null);
    (async () => {
      try {
        const doc = await getRestaurantDeliverySettings(restaurantId);
        if (!cancelled) {
          setDeliverySetting(doc);
        }
      } catch (error) {
        console.warn('Could not load restaurant delivery settings:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurant]);
  
  useEffect(() => {
    
    if (config.DEMO_MODE) {
      return;
    }

    const getUserLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          
          return;
        }

        let locationResult = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: locationResult.coords.latitude,
          longitude: locationResult.coords.longitude,
        });
      } catch (error) {
        console.warn('Erreur obtention position GPS:', error);
        
      }
    };
    
  }, [])
  
  const deliveryTime = useMemo(() => {
    const prepTime = parseInt(restaurant.collectTime, 10) || 25;

    if (config.DEMO_MODE) {
      return {
        min: prepTime + 10,
        max: prepTime + 20,
        distance: 0,
      };
    }

    return getRestaurantDeliveryTime(restaurant, userLocation);
  }, [userLocation, restaurant.latitude, restaurant.longitude, restaurant.collectTime]);

  const distance = deliveryTime.distance > 0 ? deliveryTime.distance : null;
  
  const getRestaurantStatus = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute; 

    const openingTime = restaurant.openingTime || "09:00";
    const closingTime = restaurant.closingTime || "21:00";

    const [openHour, openMin] = openingTime.split(':').map(Number);
    const [closeHour, closeMin] = closingTime.split(':').map(Number);

    const openTimeMinutes = openHour * 60 + openMin;
    const closeTimeMinutes = closeHour * 60 + closeMin;

    const isOpen = currentTime >= openTimeMinutes && currentTime < closeTimeMinutes;
    
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

  if (!userLocation) {
    return (
      <View testID="restaurant-detail-screen" accessibilityLabel="restaurant-detail-screen">
        <Loader />
      </View>
    )
  }
  
  const formattedRating = formatRestaurantRatingDisplay(
    restaurant.rating,
    restaurant.review_count,
  );
  const price = restaurant.price || "$$";
  
  const categoriesText = restaurant.categories && restaurant.categories.length > 0
    ? restaurant.categories.map(cat => cat.title || cat.name).join(' • ')
    : 'Restaurant';
  
  const restaurantId = getRestaurantMongoId(restaurant);
  const isFavorite = userFavorites.some((id) => String(id) === String(restaurantId));
  
  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await removeFromFavorites(restaurantId);
        setUserFavorites((prev) => prev.filter((id) => String(id) !== String(restaurantId)));
        dispatch({ type: 'REMOVE_FAVORITE', payload: restaurantId });
      } else {
        await addToFavorites(restaurantId);
        setUserFavorites((prev) => [...prev, restaurantId]);
        dispatch({ type: 'ADD_FAVORITE', payload: restaurantId });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };
  
  const openDirections = () => {
    const lat = restaurant.latitude;
    const lng = restaurant.longitude;
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(restaurant.name)})`,
    });
    Linking.openURL(url).catch(err => console.error('Error opening directions:', err));
  };
  
  const callRestaurant = () => {
    const phoneNumber = restaurant.phone || restaurant.display_phone;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`).catch(err => console.error('Error calling:', err));
    }
  };

  return (
    <View testID="restaurant-detail-screen" accessibilityLabel="restaurant-detail-screen" style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
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
      
      <View style={styles.contentCard}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          
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
          
          {promotions.length > 0 && (
            <View style={styles.promotionsSection}>
              <View style={styles.promotionsHeader}>
                <Text style={styles.promotionsTitle}>{i18n.t('restaurant.availableOffers')}</Text>
                <Icon name="local-offer" type="material" color={colors.primary} size={20} />
              </View>
              {promotions.map((promotion, index) => (
                <PromotionCard key={promotion._id || promotion.id || index} promotion={promotion} />
              ))}
            </View>
          )}

          <Divider width={1} color={colors.divider} style={{ marginHorizontal: 20, marginTop: promotions.length > 0 ? 10 : 0 }} />
          
          {reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <View style={styles.reviewsHeader}>
                <Text style={styles.reviewsTitle}>{i18n.t('restaurant.recentReviews')}</Text>
                
              </View>
              {reviews.map((review, index) => (
                <ReviewCard key={review._id || review.id || index} review={review} />
              ))}
            </View>
          )}

          <Divider width={1} color={colors.divider} style={{ marginHorizontal: 20, marginTop: reviews.length > 0 ? 10 : 0 }} />
          
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
      
      <View style={styles.cartContainer}>
        <ViewCart navigation={navigation} route={route} restaurant={restaurant} />
      </View>
      
      {loading && (
        <View style={styles.loaderOverlay}>
          <Loader transparent/>
        </View>
      )}
      
      <RestaurantDetailComponent
        restaurant={restaurant}
        deliverySetting={deliverySetting}
        visible={restaurantDetailVisible}
        setVisible={setRestaurantDetailVisible}
        deliveryTime={deliveryTime}
        distance={distance}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', 
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
  promotionsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  promotionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  promotionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
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