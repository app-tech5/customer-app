import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
} from 'react-native'
import React, { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { language, currency, colors } from '../global'
import { Ionicons } from '@expo/vector-icons'
import i18n from '../lang/i18n'

const PLACEHOLDER = require('../assets/images/category-placeholder.jpg')

function groupCartByRestaurant(items) {
  const groups = new Map()

  items.forEach((item) => {
    const name = item.restaurantName
    if (!name) return

    const lineTotal = Number(item.totalPrice || item.price) || 0
    const existing = groups.get(name)

    if (existing) {
      existing.itemCount += 1
      existing.subtotal += lineTotal
    } else {
      groups.set(name, {
        restaurantName: name,
        restaurantImage: item.restaurantImage,
        restaurant: item.restaurant,
        itemCount: 1,
        subtotal: lineTotal,
      })
    }
  })

  return Array.from(groups.values())
}

export default function CartScreen({ navigation }) {
  const items = useSelector((state) => state.cartReducer)
  const user = useSelector((state) => state.userReducer)

  const restaurantCarts = useMemo(() => groupCartByRestaurant(items), [items])
  const totalItems = items.length
  const grandTotal = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.totalPrice || item.price) || 0), 0),
    [items]
  )

  const deliveryAddress =
    typeof user?.address === 'string' ? user.address.trim() : ''

  useEffect(() => {
    navigation.setOptions({
      title: i18n.t('cart.title'),
    })
  }, [navigation])

  const formatPrice = (price) =>
    Number(price).toLocaleString(language, { style: 'currency', currency })

  const openCartDetails = (group) => {
    navigation.navigate('CartDetails', {
      restaurantName: group.restaurantName,
      restaurant: group.restaurant,
    })
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>
        {i18n.t('cart.summaryCount', {
          items: totalItems,
          restaurants: restaurantCarts.length,
        })}
      </Text>
      <Text style={styles.headerSubtitle}>
        {i18n.t('cart.total')}: {formatPrice(grandTotal)}
      </Text>
    </View>
  )

  const renderRestaurantCard = ({ item: group }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openCartDetails(group)}
      activeOpacity={0.7}
    >
      <Image
        source={group.restaurantImage ? { uri: group.restaurantImage } : PLACEHOLDER}
        style={styles.restaurantImage}
        defaultSource={PLACEHOLDER}
      />
      <View style={styles.cardContent}>
        <Text style={styles.restaurantName} numberOfLines={1}>
          {group.restaurantName}
        </Text>
        <Text style={styles.meta}>
          {group.itemCount}{' '}
          {group.itemCount === 1 ? i18n.t('cart.item') : i18n.t('cart.items')}
          {' • '}
          {formatPrice(group.subtotal)}
        </Text>
        {deliveryAddress ? (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.address} numberOfLines={1}>
              {i18n.t('cart.deliverTo', { address: deliveryAddress })}
            </Text>
          </View>
        ) : (
          <Text style={styles.noAddress}>{i18n.t('cart.noAddress')}</Text>
        )}
        <Text style={styles.viewDetails}>{i18n.t('cart.viewDetails')}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color={colors.grey[400]} />
    </TouchableOpacity>
  )

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="basket-outline" size={72} color={colors.grey[400]} />
          </View>
          <Text style={styles.emptyTitle}>{i18n.t('cart.empty')}</Text>
          <Text style={styles.emptySubtitle}>{i18n.t('cart.emptySubtitle')}</Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.85}
          >
            <Ionicons name="restaurant-outline" size={20} color={colors.text.white} />
            <Text style={styles.exploreButtonText}>{i18n.t('cart.startShopping')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
      <FlatList
        data={restaurantCarts}
        keyExtractor={(item) => item.restaurantName}
        renderItem={renderRestaurantCard}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 14,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  restaurantImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.grey[100],
  },
  cardContent: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  meta: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  address: {
    flex: 1,
    fontSize: 12,
    color: colors.text.secondary,
  },
  noAddress: {
    fontSize: 12,
    color: colors.warning,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  viewDetails: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyIconWrap: {
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  exploreButtonText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
})
