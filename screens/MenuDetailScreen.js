import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity} from 'react-native'
import React from 'react'
import { language, colors } from '../global'
import AddToCartButton from '../components/AddToCartButton'
import ViewCart from '../components/restaurantDetail/ViewCart'
import { AntDesign, MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import BackButton from '../components/BackButton'
import { getVariants } from '../api'
import i18n from '../lang/i18n'
import { useSettings } from '../contexts/SettingContext'

export default function MenuDetailScreen({route}) {
  const navigation = useNavigation()
  
  const routeParams = route?.params || {}
  const menu = routeParams.food
  const restaurant = routeParams.restaurant
  const { settings } = useSettings()
  
  const [selectedVariants, setSelectedVariants] = React.useState({})
  
  const [variantDetails, setVariantDetails] = React.useState({})
  
  React.useEffect(() => {
    const fetchVariantDetails = async () => {
      if (menu?.variants && menu.variants.length > 0) {
        const allVariants = await getVariants()
        const variantIds = menu.variants.map(v => v.value || v._id).filter(Boolean)
        const relevantVariants = allVariants.filter(variant =>
          variantIds.includes(variant._id.toString())
        )
        const detailsMap = {}
        relevantVariants.forEach(variant => {
          detailsMap[variant._id.toString()] = variant
        })
        setVariantDetails(detailsMap)
      }
    }

    fetchVariantDetails()
  }, [menu])
  
  const foodForCart = React.useMemo(() => {
    const safeSelectedVariants = selectedVariants || {}
    const hasVariants = Object.keys(safeSelectedVariants).length > 0

    const basePrice = menu.price
    const isDiscountActive = menu.discount?.isActive
    const discountPercentage = menu.discount?.percentage || 0

    let discountedPrice = basePrice
    if (isDiscountActive && discountPercentage > 0) {
      const discountAmount = basePrice * (discountPercentage / 100)
      discountedPrice = basePrice - discountAmount
    }
    
    let totalExtra = 0
    if (hasVariants) {
      Object.entries(safeSelectedVariants).forEach(([variantId, quantity]) => {
        
        const variantDetail = variantDetails[variantId]

        if (variantDetail && variantDetail.extra) {
          
          const extraForThisVariant = variantDetail.extra * quantity
          totalExtra += extraForThisVariant
        }
      })
    }

    const finalPrice = discountedPrice + totalExtra

    return {
      ...menu,
      selectedVariants: safeSelectedVariants,
      totalPrice: finalPrice
    }
  }, [menu, selectedVariants, variantDetails])
  
  const [currentImage, setCurrentImage] = React.useState(
    menu?.image && menu.image.trim()
      ? { uri: menu.image.trim() }
      : require('../assets/images/default-food.jpg')
  )
  
  const priceInfo = React.useMemo(() => {
    const basePrice = Number(menu.price) || 0
    const isDiscountActive = menu.discount?.isActive
    const discountPercentage = menu.discount?.percentage || 0

    if (isDiscountActive && discountPercentage > 0) {
      const discountAmount = basePrice * (discountPercentage / 100)
      return {
        originalPrice: basePrice,
        discountedPrice: basePrice - discountAmount,
        discountPercentage: discountPercentage
      }
    }
    return { originalPrice: basePrice, discountedPrice: basePrice, discountPercentage: 0 }
  }, [menu.price, menu.discount])
  
  const formatPrice = (price) => {
    return price.toLocaleString(language, { style: "currency", currency: settings.currency.code })
  }
  
  const addVariant = (variantId) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variantId]: (prev[variantId] || 0) + 1
    }))
  }

  const removeVariant = (variantId) => {
    setSelectedVariants(prev => {
      const newQuantity = (prev[variantId] || 0) - 1
      if (newQuantity <= 0) {
        const { [variantId]: removed, ...rest } = prev
        return rest
      }
      return { ...prev, [variantId]: newQuantity }
    })
  }

  const getVariantQuantity = (variantId) => {
    return selectedVariants[variantId] || 0
  }

  const renderProduct = ({ item, index }) => (
    <View style={styles.productItem}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.label || `${i18n.t('menu.product')} ${index + 1}`}</Text>
        {item.description && (
          <Text style={styles.productDescription}>{item.description}</Text>
        )}
      </View>
      <View style={styles.productIndicator}>
        <MaterialIcons name="restaurant-menu" size={20} color={colors.primary} />
      </View>
    </View>
  )

  return (
    <>
      {}
      <BackButton
        onPress={() => navigation.goBack()}
        backgroundColor="rgba(0, 0, 0, 0.6)"
        iconColor="white"
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {}
        <View style={styles.imageContainer}>
          <Image
            source={currentImage}
            style={styles.image}
            onError={() => {
              setCurrentImage(require('../assets/images/default-food.jpg'))
            }}
          />
          <View style={styles.imageOverlay} />

          {}
          <View style={[styles.availabilityBadge, { backgroundColor: menu.availability !== false ? colors.success : colors.error }]}>
            <MaterialIcons
              name={menu.availability !== false ? "check-circle" : "cancel"}
              size={16}
              color="white"
            />
            <Text style={styles.availabilityText}>
              {menu.availability !== false ? i18n.t('common.available') : i18n.t('common.unavailable')}
            </Text>
          </View>
        </View>

        {}
        <View style={styles.section1}>
          <Text style={styles.title}>{menu.name}</Text>

          {}
          <View style={styles.priceContainer}>
            {priceInfo.discountPercentage > 0 ? (
              <>
                <Text style={styles.originalPrice}>
                  {formatPrice(priceInfo.originalPrice)}
                </Text>
                <Text style={styles.discountedPrice}>
                  {formatPrice(priceInfo.discountedPrice)}
                </Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    -{priceInfo.discountPercentage}%
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.price}>
                {formatPrice(priceInfo.originalPrice)}
              </Text>
            )}
          </View>

          {}
          <View style={styles.metaContainer}>
            {menu.rating && menu.rating.average > 0 && (
              <View style={styles.ratingContainer}>
                <AntDesign name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {i18n.t('restaurant.ratingWithReviews', { rating: menu.rating.average.toFixed(1), count: menu.rating.count })}
                </Text>
              </View>
            )}

            <View style={styles.timeContainer}>
              <MaterialIcons name="schedule" size={16} color={colors.primary} />
              <Text style={styles.timeText}>
                {menu.preparation_time} {i18n.t('common.minutesAbbrev')}
              </Text>
            </View>
          </View>

          <Text style={styles.description}>{menu.description}</Text>
        </View>

        <View style={styles.divider1} />

        {}
        {menu.ingredients && menu.ingredients.length > 0 && (
          <View style={styles.section2}>
            <View style={styles.sectionHeader}>
              <Text style={styles.title1}>{i18n.t('menu.ingredients')}</Text>
            </View>
            <View style={styles.ingredientsContainer}>
              <Text style={styles.ingredientsText}>
                {menu.ingredients.join(' • ')}
              </Text>
            </View>
          </View>
        )}

        {}
        {menu.variants && menu.variants.length > 0 && (
          <View style={styles.section2}>
            <View style={styles.sectionHeader}>
              <Text style={styles.title1}>{i18n.t('menu.availableOptions')}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {menu.variants.length} {menu.variants.length > 1 ? i18n.t('menu.options') : i18n.t('menu.option')}
                </Text>
              </View>
            </View>
            <View style={styles.variantsList}>
              {}
              {menu.variants.map((variant, index) => {
                
                const variantId = variant.value || variant._id || `variant-${index}`
                const quantity = getVariantQuantity(variantId) 

                return (
                  <View key={`variant-${index}`} style={styles.variantItem}>
                    <View style={styles.variantContent}>
                      <View style={styles.variantInfo}>
                        <Text style={styles.variantName}>{variant.label}</Text>
                        <Text style={styles.variantType}>{i18n.t('menu.customizableOption')}</Text>
                      </View>
                      {}
                      {(() => {
                        
                        const variantInfo = variantDetails[variantId]
                        const hasExtraPrice = variantInfo && variantInfo.extra > 0

                        return hasExtraPrice && (
                          <Text style={styles.variantPrice}>
                            +{formatPrice(variantInfo.extra)}
                          </Text>
                        );
                      })()}
                    </View>

                    <View style={styles.variantControls}>
                      {quantity > 0 && (
                        <TouchableOpacity
                          style={styles.controlButton}
                          onPress={() => removeVariant(variantId)}
                        >
                          <MaterialIcons name="remove-circle" size={24} color={colors.error} />
                        </TouchableOpacity>
                      )}

                      {quantity > 0 && (
                        <Text style={styles.quantityText}>{quantity}</Text>
                      )}

                      <TouchableOpacity
                        style={styles.controlButton}
                        onPress={() => addVariant(variantId)}
                      >
                        <MaterialIcons name="add-circle" size={24} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {}
        <View style={styles.section3}>
          <Text style={styles.title1}>{i18n.t('menu.productDetails')}</Text>

          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <MaterialIcons name="restaurant" size={20} color={colors.primary} />
              <Text style={styles.detailLabel}>{i18n.t('menu.category')}:</Text>
              <Text style={styles.detailValue}>
                {menu.category?.name || menu.categories?.label || i18n.t('menu.uncategorized')}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="schedule" size={20} color={colors.primary} />
              <Text style={styles.detailLabel}>{i18n.t('menu.preparation')}:</Text>
              <Text style={styles.detailValue}>{menu.preparation_time} {i18n.t('common.minutesAbbrev')}</Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="check-circle" size={20} color={colors.primary} />
              <Text style={styles.detailLabel}>{i18n.t('menu.availability')}:</Text>
              <Text style={[styles.detailValue, { color: menu.availability !== false ? colors.success : colors.error }]}>
                {menu.availability !== false ? i18n.t('common.available') : i18n.t('common.unavailable')}
              </Text>
            </View>

            {menu.variants && menu.variants.length > 0 && (
              <View style={styles.detailRow}>
                <MaterialIcons name="tune" size={20} color={colors.primary} />
                <Text style={styles.detailLabel}>{i18n.t('menu.customization')}:</Text>
                <Text style={styles.detailValue}>
                  {menu.variants.length} {menu.variants.length > 1 ? i18n.t('menu.options') : i18n.t('menu.option')} {menu.variants.length > 1 ? i18n.t('menu.availablePlural') : i18n.t('menu.availableSingular')}
                </Text>
              </View>
            )}
          </View>

          {}
          <View style={styles.ctaContainer}>
            <Text style={styles.ctaText}>
              {i18n.t('menu.ctaText')}
            </Text>
          </View>
        </View>

        {}
        <View style={styles.cartButtonContainer}>
          <AddToCartButton food={foodForCart} restaurant={restaurant} />
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <ViewCart params={{ restaurant: restaurant }} />
    </>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: "100%",
    height: 250,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  availabilityBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  availabilityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  section1: {
    padding: 20,
    backgroundColor: 'white',
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 12,
    lineHeight: 32,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  originalPrice: {
    fontSize: 22,
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
    marginRight: 12,
  },
  discountedPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.error,
    marginRight: 12,
  },
  discountBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  discountText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 6,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
    marginBottom: 8,
  },
  divider1: {
    borderBottomWidth: 8,
    borderBottomColor: colors.background.secondary,
    marginVertical: 20,
  },
  section2: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title1: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text.primary,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  ingredientsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  ingredientsText: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  variantsList: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  variantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.secondary,
  },
  variantContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  variantInfo: {
    flex: 1,
  },
  variantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  variantType: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  variantPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
  },
  variantControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    padding: 4,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    minWidth: 24,
    textAlign: 'center',
  },
  section3: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: colors.text.secondary,
    marginLeft: 12,
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
  },
  ctaContainer: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  ctaText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  cartButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
})