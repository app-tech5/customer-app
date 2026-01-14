import {
  View, Text, StyleSheet, ScrollView, StatusBar, Platform,
  TouchableOpacity, FlatList, Animated, ActivityIndicator,
  Image, Dimensions
} from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { AntDesign, Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons'
import { ArrowBack } from '../components/restaurantDetail/About'
import { restaurants } from '../data'
import { RestaurantInfo, RestaurantImage } from '../components/home/RestaurantItems'
import Reward from '../components/Reward'
import { colors } from '../global'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getAllActiveOffers } from '../api'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function Offers({ navigation }) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortBy, setSortBy] = useState('popularity')
  const [isLoading, setIsLoading] = useState(false)
  const [filteredOffers, setFilteredOffers] = useState([])
  const [allPromotions, setAllPromotions] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedPromotion, setSelectedPromotion] = useState(null)

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  // Catégories d'offres
  const offerCategories = [
    { id: 'all', name: 'All Deals', icon: 'local-offer', color: colors.primary },
    { id: 'discount', name: 'Discount %', icon: 'percent', color: colors.success },
    { id: 'free_delivery', name: 'Free Delivery', icon: 'local-shipping', color: colors.warning },
    { id: 'buy_one_get_one', name: 'BOGO', icon: 'card-giftcard', color: colors.error },
    { id: 'flash', name: 'Flash Deals', icon: 'flash-on', color: '#FF6B6B' }
  ]

  // Options de tri
  const sortOptions = [
    { id: 'popularity', name: 'Most Popular', icon: 'trending-up' },
    { id: 'discount', name: 'Highest Discount', icon: 'trending-down' },
    { id: 'rating', name: 'Best Rated', icon: 'star' },
    { id: 'distance', name: 'Nearest', icon: 'location-on' }
  ]

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start()

    // Simuler le chargement des offres
    loadOffers()
  }, [])

  const loadOffers = async () => {
    setIsLoading(true)
    try {
      console.log('🔥 LOADING PROMOTIONS FROM BACKEND...')

      // Récupérer toutes les promotions actives depuis le backend
      const promotionsFromBackend = await getAllActiveOffers()

      console.log('✅ PROMOTIONS RECEIVED:', promotionsFromBackend.length, 'promotions from backend')

      // Stocker toutes les promotions pour les filtres
      setAllPromotions(promotionsFromBackend)
      setFilteredOffers(promotionsFromBackend)

      console.log('🎯 PROMOTIONS LOADED SUCCESSFULLY:', promotionsFromBackend.length, 'promotions ready for display')

    } catch (error) {
      console.error('❌ Error loading promotions from backend:', error)
      // En cas d'erreur, afficher un état vide au lieu de planter
      setAllPromotions([])
      setFilteredOffers([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterOffers = (category) => {
    setActiveCategory(category)

    // Commencer avec toutes les promotions
    let filtered = [...allPromotions]

    if (category !== 'all') {
      filtered = filtered.filter(promotion => {
        switch (category) {
          case 'discount':
            return promotion.discount_percentage > 0
          case 'free_delivery':
            return promotion.free_delivery
          case 'buy_one_get_one':
            return promotion.bogo_offer
          case 'flash':
            return promotion.flash_deal
          default:
            return true
        }
      })
    }

    // Appliquer la recherche si elle existe
    if (searchQuery.trim()) {
      filtered = filtered.filter(offer =>
        offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.applicableRestaurants.some(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Appliquer le tri
    filtered = sortOffers(filtered, sortBy)
    setFilteredOffers(filtered)
  }

  const sortOffers = (offers, sortType) => {
    return [...offers].sort((a, b) => {
      switch (sortType) {
        case 'discount':
          return (b.discount_percentage || 0) - (a.discount_percentage || 0)
        case 'rating':
          // Trier par priorité des promotions
          return (b.priority || 1) - (a.priority || 1)
        case 'distance':
          // Trier par date d'expiration (plus proche en premier)
          return new Date(a.endDate) - new Date(b.endDate)
        case 'popularity':
        default:
          // Trier par nombre d'éléments applicables (restaurants/catégories)
          return (b.availabilityCount || 0) - (a.availabilityCount || 0)
      }
    })
  }

  const handleSortChange = (sortType) => {
    setSortBy(sortType)
    const sorted = sortOffers(filteredOffers, sortType)
    setFilteredOffers(sorted)
  }

  const handleSearch = (query) => {
    setSearchQuery(query)

    // Commencer avec toutes les promotions
    let filtered = [...allPromotions]

    if (query.trim()) {
      filtered = filtered.filter(offer =>
        offer.name.toLowerCase().includes(query.toLowerCase()) ||
        offer.description.toLowerCase().includes(query.toLowerCase()) ||
        offer.applicableRestaurants.some(r => r.name.toLowerCase().includes(query.toLowerCase()))
      )
    }

    // Appliquer les filtres actifs
    if (activeCategory !== 'all') {
      filtered = filtered.filter(promotion => {
        switch (activeCategory) {
          case 'discount':
            return promotion.discount_percentage > 0
          case 'free_delivery':
            return promotion.free_delivery
          case 'buy_one_get_one':
            return promotion.bogo_offer
          case 'flash':
            return promotion.flash_deal
          default:
            return true
        }
      })
    }

    // Appliquer le tri
    filtered = sortOffers(filtered, sortBy)
    setFilteredOffers(filtered)
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
    // Ici on pourrait afficher une modal de filtres avancés
  }

  const handlePromotionPress = (promotion) => {
    console.log('🎯 Promotion pressed:', promotion.name, 'Scope:', promotion.scope);

    if (promotion.scope === 'restaurant' && promotion.applicableRestaurants.length === 1) {
      // Un seul restaurant spécifique : aller directement au restaurant
      navigation.navigate('RestaurantDetail', { restaurant: promotion.applicableRestaurants[0] });
    } else if (promotion.scope === 'restaurant' && promotion.applicableRestaurants.length > 1) {
      // Plusieurs restaurants spécifiques : aller vers la recherche avec le nom de la promotion
      navigation.navigate('Search', {
        screen: 'SearchResults',
        params: {
          name: promotion.name,
          type: 'restaurant'
        }
      });
    } else if (promotion.scope === 'platform') {
      // Promotion pour tous les restaurants : aller vers la recherche générale
      navigation.navigate('Search', {
        screen: 'SearchResults',
        params: {
          name: '',
          type: 'restaurant'
        }
      });
    } else if (promotion.scope === 'category') {
      // Promotion par catégorie : aller vers les restaurants de ces catégories
      const firstCategory = promotion.applicableCategories?.[0];
      if (firstCategory) {
        navigation.navigate('Search', {
          screen: 'SearchResults',
          params: {
            name: firstCategory,
            type: 'category'
          }
        });
      }
    } else if (promotion.scope === 'item') {
      // Promotion sur des items spécifiques : aller vers la recherche par nom de promotion
      navigation.navigate('Search', {
        screen: 'SearchResults',
        params: {
          name: promotion.name,
          type: 'restaurant' // Ou 'product' si on a un écran produit
        }
      });
    } else {
      console.log('❓ Unknown scope for promotion:', promotion.name, promotion.scope);
      // Fallback : aller vers la recherche générale
      navigation.navigate('Search');
    }
  }

  const renderCategoryButton = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        activeCategory === item.id && styles.activeCategoryButton
      ]}
      onPress={() => filterOffers(item.id)}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${item.name}`}
      accessibilityState={{ selected: activeCategory === item.id }}
    >
      <View style={[
        styles.categoryIcon,
        { backgroundColor: activeCategory === item.id ? item.color : colors.grey[200] }
      ]}>
        <MaterialIcons
          name={item.icon}
          size={20}
          color={activeCategory === item.id ? 'white' : colors.grey[600]}
        />
      </View>
      <Text style={[
        styles.categoryText,
        activeCategory === item.id && styles.activeCategoryText
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  )

  const renderOfferCard = ({ item, index }) => {
    const promotion = item.promotion || {};

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <TouchableOpacity
          style={styles.offerCard}
          onPress={() => handlePromotionPress(item)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`${promotion.name}. ${promotion.description}. Available at ${item.applicableRestaurantsCount} restaurant${item.applicableRestaurantsCount > 1 ? 's' : ''}`}
          accessibilityHint="Double tap to see restaurants offering this promotion"
        >
          <View style={styles.offerBadge}>
            <MaterialIcons name="local-offer" size={16} color="white" />
            <Text style={styles.offerBadgeText}>
              {item.discount_percentage ? `${item.discount_percentage}% OFF` :
               item.free_delivery ? 'FREE DELIVERY' :
               item.bogo_offer ? 'BUY 1 GET 1' : 'SPECIAL OFFER'}
            </Text>
          </View>

          <Image source={{ uri: item.image_url }} style={styles.restaurantImage} />
          <View style={styles.restaurantInfo}>
            <Text style={styles.promotionName}>{promotion.name}</Text>
            <Text style={styles.promotionDescription} numberOfLines={2}>
              {promotion.description}
            </Text>

            <View style={styles.restaurantsCount}>
              <Ionicons name="restaurant-outline" size={14} color={colors.grey[500]} />
              <Text style={styles.restaurantsCountText}>
                Available at {item.availabilityText}
              </Text>
            </View>

            {item.applicableRestaurants && item.applicableRestaurants.length > 0 && (
              <View style={styles.restaurantPreview}>
                <Text style={styles.restaurantPreviewText}>
                  {item.applicableRestaurants.slice(0, 2).map(r => r.name).join(', ')}
                  {item.applicableRestaurantsCount > 2 && ` +${item.applicableRestaurantsCount - 2} more`}
                </Text>
              </View>
            )}

            {promotion.endDate && (
              <View style={styles.validityInfo}>
                <Ionicons name="time-outline" size={14} color={colors.grey[500]} />
                <Text style={styles.validityText}>
                  Valid until {new Date(promotion.endDate).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  const renderSortButton = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.sortButton,
        sortBy === item.id && styles.activeSortButton
      ]}
      onPress={() => handleSortChange(item.id)}
    >
      <MaterialIcons
        name={item.icon}
        size={16}
        color={sortBy === item.id ? colors.primary : colors.grey[500]}
      />
      <Text style={[
        styles.sortText,
        sortBy === item.id && styles.activeSortText
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  )

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading amazing deals...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ArrowBack navigation={navigation} />
        <Text style={styles.title}>Special Offers</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('SearchScreen')}
            accessibilityRole="button"
            accessibilityLabel="Search offers"
            accessibilityHint="Navigate to search screen"
          >
            <Ionicons name="search" size={24} color={colors.grey[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={toggleFilters}
            accessibilityRole="button"
            accessibilityLabel="Filter offers"
            accessibilityHint="Open advanced filters"
          >
            <Ionicons name="filter" size={24} color={colors.grey[600]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={offerCategories}
          renderItem={renderCategoryButton}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
               </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.sortButton,
                sortBy === option.id && styles.activeSortButton
              ]}
              onPress={() => handleSortChange(option.id)}
            >
              <MaterialIcons
                name={option.icon}
                size={16}
                color={sortBy === option.id ? colors.primary : colors.grey[500]}
              />
              <Text style={[
                styles.sortText,
                sortBy === option.id && styles.activeSortText
              ]}>
                {option.name}
              </Text>
            </TouchableOpacity>
          ))}
          </ScrollView>
    </View>

      {/* Offers List */}
      {filteredOffers.length > 0 ? (
        <FlatList
          data={filteredOffers}
          renderItem={renderOfferCard}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.offersList}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="local-offer" size={64} color={colors.grey[300]} />
          <Text style={styles.emptyStateTitle}>
            {searchQuery ? 'No matching offers' : 'No promotions found'}
          </Text>
          <Text style={styles.emptyStateText}>
            {searchQuery
              ? `No promotions found for "${searchQuery}". Try different search terms or browse all categories.`
              : 'Check back later for amazing promotions from your favorite restaurants!'
            }
          </Text>
          {searchQuery && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => handleSearch('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search and show all promotions"
            >
              <Text style={styles.clearSearchText}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.primary,
    },
    title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginLeft: 16,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: colors.grey[100],
  },

  // Categories
  categoriesContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: colors.grey[100],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  activeCategoryButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  activeCategoryText: {
    color: 'white',
    fontWeight: '600',
  },

  // Sort
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  sortLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: colors.grey[100],
  },
  activeSortButton: {
    backgroundColor: colors.primary + '20',
  },
  sortText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  activeSortText: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Offers List
  offersList: {
    padding: 16,
  },
  offerCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  offerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  offerBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  restaurantImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  restaurantInfo: {
    flex: 1,
  },
  promotionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  promotionDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 4,
  },
  reviews: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  location: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryTime: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  freeDeliveryBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  freeDeliveryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  separator: {
    height: 8,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  clearSearchButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  clearSearchText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Restaurants count and preview
  restaurantsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  restaurantsCountText: {
    fontSize: 14,
    color: colors.grey[600],
    marginLeft: 4,
  },
  restaurantPreview: {
    marginBottom: 8,
  },
  restaurantPreviewText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },

  // Validity info
  validityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  validityText: {
    fontSize: 12,
    color: colors.grey[500],
    marginLeft: 4,
  },
})