import { View, Text, FlatList, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { getOrders } from '../api'
import i18n from '../i18n'
import { colors } from '../global'
import Loader from './Loader'

export default function MyOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([])
  const [loader, setLoader] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoader(true)
      setError(null)
      const ordersData = await getOrders()
      // Trier par date décroissante (plus récent en premier)
      const sortedOrders = ordersData.sort((a, b) =>
        new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
      )
      setOrders(sortedOrders)
    } catch (err) {
      console.error('Error loading orders:', err)
      setError(i18n.t('order.loadingError', 'Error loading orders'))
    } finally {
      setLoader(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return colors.warning
      case 'confirmed': return colors.info
      case 'preparing': return colors.primary
      case 'ready': return colors.success
      case 'delivered': return colors.success
      case 'cancelled': return colors.error
      default: return colors.grey[500]
    }
  }

  const getStatusText = (status) => {
    if (!status) return i18n.t('order.status.unknown', 'Unknown')
    return i18n.t(`order.status.${status.toLowerCase()}`, status)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={() => {
        // Navigation vers les détails de la commande
        navigation.navigate('OrderDetails', { order: item })
      }}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>
            {i18n.t('order.orderId', 'Order')} #{item.id || item._id}
          </Text>
          <Text style={styles.orderDate}>
            {formatDate(item.createdAt || item.date)}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.orderContent}>
        <View style={styles.restaurantInfo}>
          <Ionicons name="restaurant" size={20} color={colors.primary} />
          <Text style={styles.restaurantName}>
            {item.restaurantName || item.restaurant?.name || 'Restaurant'}
          </Text>
        </View>

        <View style={styles.orderDetails}>
          <Text style={styles.itemCount}>
            {item.items?.length || 0} {item.items?.length === 1 ?
              i18n.t('order.item', 'item') :
              i18n.t('order.items', 'items')
            }
          </Text>
          <Text style={styles.orderTotal}>
            {item.total || item.price || 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.orderActions}>
        <TouchableOpacity
          style={styles.trackButton}
          onPress={() => {
            // Navigation vers le suivi de commande
            navigation.navigate('OrderTracking', { order: item })
          }}
        >
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={styles.trackButtonText}>
            {i18n.t('order.track', 'Track Order')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reorderButton}
          onPress={() => {
            // Logique de recommande
            console.log('Reorder:', item.id)
          }}
        >
          <Ionicons name="refresh" size={16} color={colors.primary} />
          <Text style={styles.reorderButtonText}>
            {i18n.t('order.reorder', 'Reorder')}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="receipt-outline"
        size={64}
        color={colors.grey[400]}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>
        {i18n.t('order.noOrdersTitle', 'No orders yet')}
      </Text>
      <Text style={styles.emptySubtitle}>
        {i18n.t('order.noOrdersSubtitle', 'Your order history will appear here')}
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('BottomTabs')}
      >
        <Text style={styles.shopButtonText}>
          {i18n.t('order.startOrdering', 'Start Ordering')}
        </Text>
      </TouchableOpacity>
    </View>
  )

  const ErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons
        name="alert-circle"
        size={64}
        color={colors.error}
        style={styles.errorIcon}
      />
      <Text style={styles.errorTitle}>
        {i18n.t('order.errorTitle', 'Unable to load orders')}
      </Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={loadOrders}
      >
        <Text style={styles.retryButtonText}>
          {i18n.t('common.retry', 'Retry')}
        </Text>
      </TouchableOpacity>
    </View>
  )

  if (loader) return <Loader />

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {i18n.t('drawer.myOrders', 'My Orders')}
        </Text>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('Orders')}
        >
          <Text style={styles.historyButtonText}>
            {i18n.t('order.viewAll', 'View All')}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {orders.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={orders.slice(0, 10)} // Afficher seulement les 10 dernières commandes
          keyExtractor={(item, index) => String(item.id || item._id || index)}
          renderItem={renderOrderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshing={loader}
          onRefresh={loadOrders}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  historyButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginRight: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  orderItem: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.white,
    textTransform: 'uppercase',
  },
  orderContent: {
    marginBottom: 12,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginLeft: 8,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  trackButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: 4,
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.grey[100],
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  reorderButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.primary,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
})
