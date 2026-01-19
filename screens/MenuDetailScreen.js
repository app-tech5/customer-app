import { View, Text, Image, StyleSheet, ScrollView, FlatList} from 'react-native'
import React, { useState, useEffect } from 'react'
import { language, currency, colors } from '../global'
import { Quantity } from '../components/restaurantDetail/MenuItems'
import ViewCart from '../components/restaurantDetail/ViewCart'
import { AntDesign, MaterialIcons } from '@expo/vector-icons'

// Données statiques pour démontrer le design complet
const mockMenu = {
  _id: 'menu123',
  name: 'Menu Gourmet Complet',
  description: 'Un menu exquis composé de nos meilleures spécialités, parfait pour une expérience culinaire inoubliable. Inclut entrée, plat principal et dessert avec un accord mets-vin sélectionné par notre sommelier.',
  price: 45.90,
  image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800',
  discount: { active: true, percentage: 15 },
  rating: { average: 4.7, count: 128 },
  preparation_time: 35,
  availability: true,
  products: [
    { value: 'prod1', label: 'Salade César aux crevettes grillées - Entrée fraîche et croquante' },
    { value: 'prod2', label: 'Filet de saumon rôti aux herbes - Plat principal raffiné' },
    { value: 'prod3', label: 'Risotto aux champignons sauvages - Accompagnement crémeux' },
    { value: 'prod4', label: 'Tarte au citron meringuée - Dessert acidulé et aérien' },
    { value: 'prod5', label: 'Café espresso et assortiment de petits fours - Finale parfaite' },
    { value: 'prod6', label: 'Pain artisanal et beurre aux herbes - Accompagnement' }
  ]
}

const mockRestaurant = {
  _id: 'rest123',
  name: 'Le Jardin Gourmet'
}

export default function MenuDetailScreen({route}) {
  // Utiliser les vraies données si elles ont des products, sinon les mock data pour le design
  const routeParams = route?.params || {}
  const realMenu = routeParams.food
  const menu = (realMenu && realMenu.products && realMenu.products.length > 0) ? realMenu : mockMenu
  const restaurant = routeParams.restaurant || mockRestaurant

  // Calculer le prix avec discount si applicable
  const calculatePrice = () => {
    const basePrice = Number(menu.price) || 0
    if (menu.discount && menu.discount.active && menu.discount.percentage > 0) {
      const discountAmount = basePrice * (menu.discount.percentage / 100)
      return {
        originalPrice: basePrice,
        discountedPrice: basePrice - discountAmount,
        discountPercentage: menu.discount.percentage
      }
    }
    return { originalPrice: basePrice, discountedPrice: basePrice, discountPercentage: 0 }
  }

  const priceInfo = calculatePrice()

  // Formater le prix
  const formatPrice = (price) => {
    return price.toLocaleString(language, { style: "currency", currency: currency })
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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Image du menu avec overlay dégradé */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: menu.image }}
            style={styles.image}
            defaultSource={require('../assets/images/default-food.jpg')}
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

        {/* Liste des produits du menu */}
        <View style={styles.section2}>
          <View style={styles.sectionHeader}>
            <Text style={styles.title1}>Composition du menu</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {menu.products?.length || 0} plats
              </Text>
            </View>
          </View>

          {menu.products && menu.products.length > 0 ? (
            <View style={styles.productsList}>
              {menu.products.map((product, index) => (
                <View key={`product-${index}`} style={styles.productItem}>
                  <View style={styles.productNumber}>
                    <Text style={styles.productNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.productContent}>
                    <Text style={styles.productName}>{product.label}</Text>
                    {index === 0 && <Text style={styles.productType}>Entrée</Text>}
                    {index === 1 && <Text style={styles.productType}>Plat principal</Text>}
                    {index === 2 && <Text style={styles.productType}>Accompagnement</Text>}
                    {index > 2 && <Text style={styles.productType}>Dessert</Text>}
                  </View>
                  <MaterialIcons name="restaurant-menu" size={20} color={colors.primary} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyProducts}>
              <MaterialIcons name="restaurant-menu" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyText}>
                Les détails des produits de ce menu ne sont pas disponibles pour le moment.
              </Text>
            </View>
          )}
        </View>

        {/* Résumé et informations */}
        <View style={styles.section3}>
          <Text style={styles.title1}>Résumé</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <MaterialIcons name="restaurant" size={20} color={colors.primary} />
              <Text style={styles.summaryLabel}>Nombre de plats:</Text>
              <Text style={styles.summaryValue}>{menu.products?.length || 0}</Text>
            </View>

            <View style={styles.summaryRow}>
              <MaterialIcons name="schedule" size={20} color={colors.primary} />
              <Text style={styles.summaryLabel}>Temps de préparation:</Text>
              <Text style={styles.summaryValue}>{menu.preparation_time} min</Text>
            </View>

            <View style={styles.summaryRow}>
              <MaterialIcons name="local-offer" size={20} color={colors.primary} />
              <Text style={styles.summaryLabel}>Économisez:</Text>
              <Text style={[styles.summaryValue, { color: colors.error }]}>
                {priceInfo.discountPercentage > 0 ? formatPrice(priceInfo.originalPrice - priceInfo.discountedPrice) : '-'}
              </Text>
            </View>
          </View>

          {/* Call-to-action */}
          <View style={styles.ctaContainer}>
            <Text style={styles.ctaText}>
              Ajoutez ce menu à votre commande et profitez d'une expérience gastronomique complète !
            </Text>
          </View>
        </View>

        {/* Quantité et ajout au panier */}
        <Quantity id={menu.id || menu._id} food={menu} restaurant={restaurant} screen="mds" />
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
  productsList: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.secondary,
  },
  productNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  productNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  productContent: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  productType: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyProducts: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  section3: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCard: {
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
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.text.secondary,
    marginLeft: 12,
    flex: 1,
  },
  summaryValue: {
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
})