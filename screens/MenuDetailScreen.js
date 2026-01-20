import { View, Text, Image, StyleSheet, ScrollView, FlatList, TouchableOpacity} from 'react-native'
import React, { useState, useEffect } from 'react'
import { language, currency, colors } from '../global'
import AddToCartButton from '../components/AddToCartButton'
import ViewCart from '../components/restaurantDetail/ViewCart'
import { AntDesign, MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import BackButton from '../components/BackButton'
import { getVariants } from '../api'

/**
 * GESTION DES VARIANTS/OPTIONS DANS MENU DETAIL SCREEN
 *
 * FLUX COMPLET :
 * 1. menu.variants[] = [{value: "id", label: "nom"}] (IDs des options disponibles)
 * 2. useEffect → getVariants() → récupère TOUS les variants de la DB
 * 3. variantDetails = mapping ID → détails complets {extra, price, name, etc.}
 * 4. Dans le rendu → variantDetails[variantId] → accès aux prix suppléments
 * 5. Calcul du prix total = prix_base + (extra_variants * quantités)
 *
 * PROBLÈME ACTUEL :
 * Les IDs dans menu.variants[].value ne correspondent pas aux vrais _id des variants en DB
 * → variantDetails[variantId] = undefined → prix non affiché
 */

export default function MenuDetailScreen({route}) {
  const navigation = useNavigation()

  // Utiliser directement les vraies données de la DB
  const routeParams = route?.params || {}
  const menu = routeParams.food
  const restaurant = routeParams.restaurant

  // État pour gérer les options sélectionnées
  const [selectedVariants, setSelectedVariants] = React.useState({})
  console.log('selectedVariants state:', selectedVariants)

  /*******************************
   * GESTION DES OPTIONS/VARIANTS
   *******************************/

  /**
   * variantDetails : Objet qui stocke les détails complets des variants récupérés depuis la DB
   * Clé = ID du variant (vient de menu.variants[].value)
   * Valeur = objet complet du variant { _id, name, extra, price, etc. }
   *
   * Exemple:
   * {
   *   "695d17e1ed0284bc20edc6eb": {
   *     _id: "695d17e1ed0284bc20edc6eb",
   *     name: "Jalapeños",
   *     extra: 2.50,  // ← PRIX SUPPLÉMENTAIRE utilisé pour le calcul
   *     price: 10.99,
   *     available: true
   *   }
   * }
   */
  const [variantDetails, setVariantDetails] = React.useState({})

  /**
   * RÉCUPÉRATION DES DÉTAILS DES VARIANTS
   *
   * 1. Récupère tous les variants depuis la collection 'variants'
   * 2. Filtre seulement ceux utilisés par ce menu/produit
   * 3. Stocke les détails dans variantDetails pour accès rapide
   *
   * Pourquoi ? Parce que menu.variants ne contient que {value: "id", label: "nom"}
   * Mais pour afficher les prix, on a besoin des vrais détails (extra, price, etc.)
   */
  React.useEffect(() => {
    const fetchVariantDetails = async () => {
      if (menu?.variants && menu.variants.length > 0) {
        console.log('🔍 FETCHING VARIANT DETAILS...')

        // 1. Récupérer TOUS les variants depuis la DB
        const allVariants = await getVariants()
        console.log(`📦 Retrieved ${allVariants.length} variants from DB`)

        // 2. Extraire les IDs utilisés dans ce menu
        // menu.variants = [{value: "id1", label: "Jalapeños"}, {value: "id2", label: "Cheese"}]
        const variantIds = menu.variants.map(v => v.value || v._id).filter(Boolean)
        console.log(`🎯 This menu uses ${variantIds.length} variants:`, variantIds)

        // 3. Garder seulement les variants pertinents
        const relevantVariants = allVariants.filter(variant =>
          variantIds.includes(variant._id.toString())
        )
        console.log(`✅ Found ${relevantVariants.length} matching variants`)

        // 4. Créer un mapping rapide : ID -> détails complets
        const detailsMap = {}
        relevantVariants.forEach(variant => {
          detailsMap[variant._id.toString()] = variant
        })

        setVariantDetails(detailsMap)
        console.log('💾 Variant details stored:', Object.keys(detailsMap))
      }
    }

    fetchVariantDetails()
  }, [menu])

  /**
   * CALCUL DU PRIX AVEC LES OPTIONS SÉLECTIONNÉES
   *
   * foodForCart = version enrichie du menu avec :
   * - selectedVariants : { "variantId": quantité_sélectionnée }
   * - totalPrice : prix_base + suppléments_des_options
   *
   * Exemple:
   * selectedVariants = { "695d17e1ed0284bc20edc6eb": 2 }  // 2x Jalapeños
   * variantDetails["695d17e1ed0284bc20edc6eb"].extra = 2.50
   * totalPrice = menu.price + (2.50 * 2) = menu.price + 5.00
   */
  const foodForCart = React.useMemo(() => {
    const safeSelectedVariants = selectedVariants || {}
    const hasVariants = Object.keys(safeSelectedVariants).length > 0

    console.log('🧮 CALCULATING PRICE WITH OPTIONS...')
    console.log('Selected variants:', safeSelectedVariants)

    // Calculer le total des suppléments
    let totalExtra = 0
    if (hasVariants) {
      Object.entries(safeSelectedVariants).forEach(([variantId, quantity]) => {
        // Récupérer les détails du variant depuis variantDetails
        const variantDetail = variantDetails[variantId]

        if (variantDetail && variantDetail.extra) {
          // Ajouter : prix_supplément * quantité
          const extraForThisVariant = variantDetail.extra * quantity
          totalExtra += extraForThisVariant

          console.log(`➕ ${variantDetail.name}: ${quantity}x ${variantDetail.extra}€ = +${extraForThisVariant}€`)
        } else {
          console.log(`⚠️  No details found for variant ${variantId}`)
        }
      })
    }

    const finalPrice = menu.price + totalExtra
    console.log(`💰 Base price: ${menu.price}€ + Extra: ${totalExtra}€ = Total: ${finalPrice}€`)

    return {
      ...menu,
      selectedVariants: safeSelectedVariants,
      totalPrice: finalPrice
    }
  }, [menu, selectedVariants, variantDetails])

  // État pour gérer l'image actuelle
  const [currentImage, setCurrentImage] = React.useState(
    menu?.image && menu.image.trim()
      ? { uri: menu.image.trim() }
      : require('../assets/images/default-food.jpg')
  )

  // Calculer le prix avec discount si applicable
  const calculatePrice = () => {
    const basePrice = Number(menu.price) || 0
    // Vérifier isActive (dans la vraie DB) ou active (version alternative)
    const isDiscountActive = menu.discount && (menu.discount.isActive === true || menu.discount.active === true)
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
  }

  const priceInfo = calculatePrice()

  // Formater le prix
  const formatPrice = (price) => {
    return price.toLocaleString(language, { style: "currency", currency: currency })
  }

  // Gérer les options sélectionnées
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
        <Text style={styles.productName}>{item.label || `Produit ${index + 1}`}</Text>
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
      {/* Bouton de retour */}
      <BackButton
        onPress={() => navigation.goBack()}
        backgroundColor="rgba(0, 0, 0, 0.6)"
        iconColor="white"
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Image du menu avec overlay dégradé */}
        <View style={styles.imageContainer}>
          <Image
            source={currentImage}
            style={styles.image}
            onError={() => {
              console.log('Image failed to load, using default:', menu?.image)
              setCurrentImage(require('../assets/images/default-food.jpg'))
            }}
          />
          <View style={styles.imageOverlay} />

          {/* Badge de disponibilité */}
          <View style={[styles.availabilityBadge, { backgroundColor: menu.availability !== false ? colors.success : colors.error }]}>
            <MaterialIcons
              name={menu.availability !== false ? "check-circle" : "cancel"}
              size={16}
              color="white"
            />
            <Text style={styles.availabilityText}>
              {menu.availability !== false ? "Disponible" : "Indisponible"}
            </Text>
          </View>
        </View>

        {/* Informations principales du menu */}
        <View style={styles.section1}>
          <Text style={styles.title}>{menu.name}</Text>

          {/* Prix avec discount si applicable */}
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

          {/* Rating et préparation */}
          <View style={styles.metaContainer}>
            {menu.rating && menu.rating.average > 0 && (
              <View style={styles.ratingContainer}>
                <AntDesign name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {menu.rating.average.toFixed(1)} ({menu.rating.count} avis)
                </Text>
              </View>
            )}

            <View style={styles.timeContainer}>
              <MaterialIcons name="schedule" size={16} color={colors.primary} />
              <Text style={styles.timeText}>
                {menu.preparation_time} min
              </Text>
            </View>
          </View>

          <Text style={styles.description}>{menu.description}</Text>
        </View>

        <View style={styles.divider1} />

        {/* Ingrédients du produit */}
        {menu.ingredients && menu.ingredients.length > 0 && (
          <View style={styles.section2}>
            <View style={styles.sectionHeader}>
              <Text style={styles.title1}>Ingrédients</Text>
            </View>
            <View style={styles.ingredientsContainer}>
              <Text style={styles.ingredientsText}>
                {menu.ingredients.join(' • ')}
              </Text>
            </View>
          </View>
        )}

        {/* Variants/options disponibles */}
        {menu.variants && menu.variants.length > 0 && (
          <View style={styles.section2}>
            <View style={styles.sectionHeader}>
              <Text style={styles.title1}>Options disponibles</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {menu.variants.length} option{menu.variants.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <View style={styles.variantsList}>
              {/* AFFICHAGE DES OPTIONS DISPONIBLES */}
              {menu.variants.map((variant, index) => {
                // variant = { value: "variant_id", label: "Nom affiché" }
                const variantId = variant.value || variant._id || `variant-${index}`
                const quantity = getVariantQuantity(variantId) // Nombre sélectionné (0, 1, 2...)

                // RÉCUPÉRATION DES DÉTAILS POUR AFFICHER LE PRIX
                // variantDetails[variantId] = { _id, name, extra, price, ... }

                return (
                  <View key={`variant-${index}`} style={styles.variantItem}>
                    <View style={styles.variantContent}>
                      <View style={styles.variantInfo}>
                        <Text style={styles.variantName}>{variant.label}</Text>
                        <Text style={styles.variantType}>Option personnalisable</Text>
                      </View>
                      {/* AFFICHAGE DU PRIX SUPPLÉMENTAIRE DE L'OPTION */}
                      {(() => {
                        // RÉCUPÉRER LES DÉTAILS DU VARIANT POUR SON PRIX
                        const variantInfo = variantDetails[variantId]
                        const hasExtraPrice = variantInfo && variantInfo.extra > 0

                        // DEBUG : pourquoi le prix ne s'affiche pas ?
                        console.log(`💰 VARIANT PRICE:`, {
                          name: variant.label,
                          id: variantId,
                          detailsFound: !!variantInfo,
                          extraPrice: variantInfo?.extra,
                          willShow: hasExtraPrice
                        });

                        // Afficher "+2,50 €" si le variant coûte extra
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

        {/* Informations détaillées */}
        <View style={styles.section3}>
          <Text style={styles.title1}>Détails du produit</Text>

          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <MaterialIcons name="restaurant" size={20} color={colors.primary} />
              <Text style={styles.detailLabel}>Catégorie:</Text>
              <Text style={styles.detailValue}>
                {menu.category?.name || menu.categories?.label || 'Non catégorisé'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="schedule" size={20} color={colors.primary} />
              <Text style={styles.detailLabel}>Préparation:</Text>
              <Text style={styles.detailValue}>{menu.preparation_time} min</Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="check-circle" size={20} color={colors.primary} />
              <Text style={styles.detailLabel}>Disponibilité:</Text>
              <Text style={[styles.detailValue, { color: menu.availability !== false ? colors.success : colors.error }]}>
                {menu.availability !== false ? 'Disponible' : 'Indisponible'}
              </Text>
            </View>

            {menu.variants && menu.variants.length > 0 && (
              <View style={styles.detailRow}>
                <MaterialIcons name="tune" size={20} color={colors.primary} />
                <Text style={styles.detailLabel}>Personnalisation:</Text>
                <Text style={styles.detailValue}>
                  {menu.variants.length} option{menu.variants.length > 1 ? 's' : ''} disponible{menu.variants.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>

          {/* Call-to-action */}
          <View style={styles.ctaContainer}>
            <Text style={styles.ctaText}>
              Ajoutez ce produit à votre commande et personnalisez-le selon vos goûts !
            </Text>
          </View>
        </View>

        {/* Bouton d'ajout au panier - centré en bas */}
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