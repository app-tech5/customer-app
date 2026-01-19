import { View, Text, Image, StyleSheet, ScrollView, FlatList} from 'react-native'
import React, { useState, useEffect } from 'react'
import { language, currency, colors } from '../global'
import { Quantity } from '../components/restaurantDetail/MenuItems'
import ViewCart from '../components/restaurantDetail/ViewCart'
import { AntDesign, MaterialIcons } from '@expo/vector-icons'

export default function MenuDetailScreen({route}) {
  const {food: menu, restaurant} = route.params

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
      <ScrollView style={styles.container}>
        {/* Image du menu */}
        <Image
          source={{ uri: menu.image }}
          style={styles.image}
          defaultSource={require('../assets/images/default-food.jpg')}
        />

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

          {/* Rating si disponible */}
          {menu.rating && menu.rating.average > 0 && (
            <View style={styles.ratingContainer}>
              <AntDesign name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>
                {menu.rating.average.toFixed(1)} ({menu.rating.count} avis)
              </Text>
            </View>
          )}

          <Text style={styles.description}>{menu.description}</Text>
        </View>

        <View style={styles.divider1} />

        {/* Liste des produits du menu */}
        <View style={styles.section2}>
          <Text style={styles.title1}>Composition du menu</Text>
          <Text style={styles.subtitle}>
            Ce menu contient {menu.products?.length || 0} produit{menu.products?.length > 1 ? 's' : ''}
          </Text>

          {menu.products && menu.products.length > 0 ? (
            <FlatList
              data={menu.products}
              renderItem={renderProduct}
              keyExtractor={(item, index) => `product-${index}`}
              style={styles.productsList}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyProducts}>
              <MaterialIcons name="info-outline" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyText}>
                Les détails des produits de ce menu ne sont pas disponibles pour le moment.
              </Text>
            </View>
          )}
        </View>

        {/* Informations supplémentaires */}
        <View style={styles.section3}>
          {/* Temps de préparation */}
          {menu.preparation_time && menu.preparation_time > 0 && (
            <View style={styles.infoItem}>
              <MaterialIcons name="schedule" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                Temps de préparation: {menu.preparation_time} minutes
              </Text>
            </View>
          )}

          {/* Disponibilité */}
          <View style={styles.infoItem}>
            <MaterialIcons
              name={menu.availability !== false ? "check-circle" : "cancel"}
              size={20}
              color={menu.availability !== false ? colors.success : colors.error}
            />
            <Text style={styles.infoText}>
              {menu.availability !== false ? "Disponible" : "Indisponible"}
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
  image: {
    width: "100%",
    height: 220,
  },
  section1: {
    padding: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.primary,
  },
  originalPrice: {
    fontSize: 20,
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
    marginRight: 12,
  },
  discountedPrice: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.error,
    marginRight: 12,
  },
  discountBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginLeft: 6,
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  divider1: {
    borderBottomWidth: 8,
    borderBottomColor: colors.background.secondary,
    marginVertical: 20,
  },
  section2: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  title1: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  productsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.secondary,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  productIndicator: {
    marginLeft: 12,
  },
  emptyProducts: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  section3: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 12,
  },
})