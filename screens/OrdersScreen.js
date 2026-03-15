import { View, Text, FlatList, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native'
import React, { useEffect, useState, useMemo } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { getOrders } from '../api'
import i18n from '../i18n'
import { colors } from '../global'
import { useSettings } from '../contexts/SettingContext'
import Loader from './Loader'

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([])
  const [loader, setLoader] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState(null)
  const { currency } = useSettings()

  useEffect(() => {
    loadOrders()
    
    navigation.setOptions({
      title: i18n.t('order.allOrders', 'All Orders'),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.toggleDrawer()}
          style={{ padding: 10, marginLeft: 5 }}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Ionicons name="menu" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      ),
    })
  }, [navigation])

  const loadOrders = async () => {
    try {
      setLoader(true)
      setError(null)

      const ordersData = await getOrders()
      
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

  const handleCancelOrder = async (order) => {
    try {
      
      if (order.status?.toLowerCase() !== 'pending') {
        Alert.alert(
          i18n.t('order.cancelError', 'Cancel Error'),
          i18n.t('order.cannotCancel', 'This order cannot be cancelled')
        )
        return
      }
      
      Alert.alert(
        i18n.t('order.confirmCancel', 'Confirm Cancellation'),
        i18n.t('order.cancelMessage', 'Are you sure you want to cancel this order? This action cannot be undone.'),
        [
          {
            text: i18n.t('common.cancel', 'Cancel'),
            style: 'cancel'
          },
          {
            text: i18n.t('order.confirmCancelButton', 'Cancel Order'),
            style: 'destructive',
            onPress: () => proceedWithCancel(order)
          }
        ]
      )
    } catch (error) {
      console.error('Error cancelling order:', error)
      Alert.alert(
        i18n.t('order.cancelError', 'Cancel Error'),
        i18n.t('order.cancelFailed', 'Failed to cancel order')
      )
    }
  }

  const proceedWithCancel = async (order) => {
    try {
      const orderId = order.id || order._id
      await cancelOrder(orderId)
      
      setOrders(prevOrders =>
        prevOrders.map(o =>
          (o.id || o._id) === orderId
            ? { ...o, status: 'cancelled' }
            : o
        )
      )

      Alert.alert(
        i18n.t('order.cancelSuccess', 'Order Cancelled'),
        i18n.t('order.cancelSuccessMessage', 'Your order has been successfully cancelled')
      )
    } catch (error) {
      console.error('Error cancelling order:', error)
      Alert.alert(
        i18n.t('order.cancelError', 'Cancel Error'),
        i18n.t('order.cancelFailed', 'Failed to cancel order')
      )
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return colors.warning
      case 'preparing': return colors.primary
      case 'out_for_delivery': return colors.info
      case 'delivered': return colors.success
      case 'cancelled': return colors.error
      default: return colors.grey[500]
    }
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'time-outline'
      case 'preparing': return 'restaurant-outline'
      case 'out_for_delivery': return 'bicycle-outline'
      case 'delivered': return 'checkmark-circle-outline'
      case 'cancelled': return 'close-circle-outline'
      default: return 'help-circle-outline'
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

  const formatTimeAgo = (dateString) => {
    if (!dateString) return ''
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))

    if (diffInHours < 1) return i18n.t('order.justNow', 'Just now')
    if (diffInHours < 24) return `${diffInHours}h ${i18n.t('order.ago', 'ago')}`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ${i18n.t('order.ago', 'ago')}`

    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks}w ${i18n.t('order.ago', 'ago')}`
  }

  const formatEstimatedTime = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const diff = date - now
    const minutes = Math.floor(diff / 60000)

    if (minutes < 0) return i18n.t('order.delivered', 'Delivered')
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}min`
  }
  
  const orderStats = useMemo(() => {
    const stats = {
      total: orders.length,
      pending: 0,
      preparing: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
    }

    orders.forEach(order => {
      const status = order.status?.toLowerCase()
      if (stats[status] !== undefined) {
        stats[status]++
      }
    })

    return stats
  }, [orders])
  
  const filteredOrders = useMemo(() => {
    let filtered = orders
    
    if (selectedStatus) {
      filtered = filtered.filter(order =>
        order.status?.toLowerCase() === selectedStatus.toLowerCase()
      )
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(order => {
        const restaurantName = (order.restaurant?.name || order.restaurantName || '').toLowerCase()
        const orderId = String(order.id || order._id || '').toLowerCase()
        return restaurantName.includes(query) || orderId.includes(query)
      })
    }

    return filtered
  }, [orders, searchQuery, selectedStatus])

  const statusFilters = [
    { label: i18n.t('order.all', 'All'), value: null, count: orderStats.total },
    { label: i18n.t('order.status.pending', 'Pending'), value: 'pending', count: orderStats.pending },
    { label: i18n.t('order.status.preparing', 'Preparing'), value: 'preparing', count: orderStats.preparing },
    { label: i18n.t('order.status.out_for_delivery', 'Out for Delivery'), value: 'out_for_delivery', count: orderStats.out_for_delivery },
    { label: i18n.t('order.status.delivered', 'Delivered'), value: 'delivered', count: orderStats.delivered },
    { label: i18n.t('order.status.cancelled', 'Cancelled'), value: 'cancelled', count: orderStats.cancelled },
  ]

  const renderOrderItem = ({ item, index }) => (
    <View style={styles.orderItemContainer}>
      
      <View style={styles.timelineContainer}>
        <View style={styles.timelineLine} />
        <View style={[styles.timelineDot, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons name={getStatusIcon(item.status)} size={12} color={colors.text.white} />
        </View>
      </View>

      <TouchableOpacity
        style={styles.orderItem}
        onPress={() => navigation.navigate('OrderDetails', { order: item })}
        activeOpacity={0.7}
      >
        
        <View style={styles.orderHeader}>
          <View style={styles.orderLeft}>
            <Text style={styles.orderId}>
              {i18n.t('order.orderId', 'Order')} #{item.id || item._id}
            </Text>
            <Text style={styles.orderTime}>
              {formatTimeAgo(item.createdAt || item.date)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Ionicons name={getStatusIcon(item.status)} size={14} color={colors.text.white} />
            <Text style={styles.statusText}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>

        
        <View style={styles.restaurantSection}>
          <View style={styles.restaurantIcon}>
            <Ionicons name="restaurant" size={20} color={colors.primary} />
          </View>
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>
              {item.restaurant?.name || item.restaurantName || 'Restaurant inconnu'}
            </Text>
            <Text style={styles.orderDate}>
              {formatDate(item.createdAt || item.date)}
            </Text>
          </View>
        </View>

        
        <View style={styles.orderDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="bag-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>
              {item.items?.length || 0} {item.items?.length === 1 ?
                i18n.t('order.item', 'item') :
                i18n.t('order.items', 'items')
              }
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.orderTotal}>
              {item.totalPrice && !isNaN(item.totalPrice) ?
                `${item.totalPrice.toFixed(2)}${currency.symbol}` : 'N/A'
              }
            </Text>
          </View>
        </View>

        
        <View style={styles.additionalInfo}>
          
          {item.payment?.method && (
            <View style={styles.infoItem}>
              <Ionicons name="card-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.infoText}>
                {i18n.t(`payment.${item.payment.method}`, item.payment.method)}
              </Text>
            </View>
          )}

          
          {item.delivery?.type && (
            <View style={styles.infoItem}>
              <Ionicons
                name={item.delivery.type === 'delivery' ? "bicycle-outline" : "storefront-outline"}
                size={14}
                color={colors.text.secondary}
              />
              <Text style={styles.infoText}>
                {i18n.t(`delivery.${item.delivery.type}`, item.delivery.type)}
              </Text>
            </View>
          )}

          
          {item.status?.toLowerCase() === 'out_for_delivery' && item.delivery?.estimatedTime && (
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={14} color={colors.primary} />
              <Text style={styles.estimatedTimeText}>
                {i18n.t('order.estimatedArrival', 'ETA')}: {formatEstimatedTime(item.delivery.estimatedTime)}
              </Text>
            </View>
          )}

          
          {item.status?.toLowerCase() === 'out_for_delivery' && item.driver?.userId && (
            <View style={styles.infoItem}>
              <Ionicons name="person-outline" size={14} color={colors.primary} />
              <Text style={styles.driverText}>
                {item.driver.userId?.name || i18n.t('order.driverName', 'Driver')}
              </Text>
            </View>
          )}
        </View>

        
        <View style={styles.orderActions}>
          {item.status?.toLowerCase() === 'pending' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelOrder(item)}
            >
              <Ionicons name="close-circle" size={16} color={colors.error} />
              <Text style={styles.cancelButtonText}>
                {i18n.t('order.cancel', 'Cancel')}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => navigation.navigate('OrderTracking', { order: item })}
          >
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={styles.trackButtonText}>
              {i18n.t('order.track', 'Track Order')}
            </Text>
          </TouchableOpacity>

        </View>
      </TouchableOpacity>
    </View>
  )

  const StatsHeader = () => (
    <View style={styles.statsContainer}>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{orderStats.total}</Text>
          <Text style={styles.statLabel}>{i18n.t('order.total', 'Total')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{orderStats.delivered}</Text>
          <Text style={styles.statLabel}>{i18n.t('order.completed', 'Completed')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{orderStats.pending + orderStats.preparing + orderStats.out_for_delivery}</Text>
          <Text style={styles.statLabel}>{i18n.t('order.active', 'Active')}</Text>
        </View>
      </View>
    </View>
  )

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="receipt-outline" size={80} color={colors.grey[300]} />
      </View>
      <Text style={styles.emptyTitle}>
        {i18n.t('order.noOrdersTitle', 'No orders yet')}
      </Text>
      <Text style={styles.emptySubtitle}>
        {i18n.t('order.noOrdersSubtitle', 'Your delicious food journey starts here')}
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('BottomTabs')}
      >
        <Ionicons name="restaurant" size={20} color={colors.text.white} />
        <Text style={styles.shopButtonText}>
          {i18n.t('order.startOrdering', 'Start Ordering')}
        </Text>
      </TouchableOpacity>
    </View>
  )

  const ErrorState = () => (
    <View style={styles.errorContainer}>
      <View style={styles.errorIconContainer}>
        <Ionicons name="alert-circle" size={80} color={colors.error} />
      </View>
      <Text style={styles.errorTitle}>
        {i18n.t('order.errorTitle', 'Unable to load orders')}
      </Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={loadOrders}
      >
        <Ionicons name="refresh" size={20} color={colors.text.white} />
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

      {orders.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          
          <StatsHeader />

          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.text.secondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={i18n.t('order.searchPlaceholder', 'Search by restaurant or order ID...')}
              placeholderTextColor={colors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>

          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
            contentContainerStyle={styles.filtersContent}
          >
            {statusFilters.map((filter) => (
              <TouchableOpacity
                key={filter.value || 'all'}
                style={[
                  styles.filterChip,
                  selectedStatus === filter.value && styles.filterChipActive
                ]}
                onPress={() => setSelectedStatus(filter.value)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedStatus === filter.value && styles.filterChipTextActive
                ]}>
                  {filter.label}
                </Text>
                {filter.count > 0 && (
                  <View style={[
                    styles.filterCount,
                    selectedStatus === filter.value && styles.filterCountActive
                  ]}>
                    <Text style={[
                      styles.filterCountText,
                      selectedStatus === filter.value && styles.filterCountTextActive
                    ]}>
                      {filter.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          
          {filteredOrders.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={64} color={colors.grey[400]} />
              <Text style={styles.noResultsText}>
                {i18n.t('order.noResults', 'No orders found')}
              </Text>
              <Text style={styles.noResultsSubtext}>
                {i18n.t('order.tryDifferentSearch', 'Try adjusting your search or filters')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredOrders}
              keyExtractor={(item, index) => String(item.id || item._id || index)}
              renderItem={renderOrderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              refreshing={loader}
              onRefresh={loadOrders}
            />
          )}
        </>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  statsContainer: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  filtersContainer: {
    marginBottom: 16,
    maxHeight: 60,
    minHeight: 60
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: colors.background.primary,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    height: 45

  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    height: 45
  },
  filterChipText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.text.white,
  },
  filterCount: {
    backgroundColor: colors.grey[200],
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  filterCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterCountText: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  filterCountTextActive: {
    color: colors.text.white,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  orderItemContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineContainer: {
    width: 40,
    alignItems: 'center',
    paddingTop: 20,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border.light,
    marginTop: 20,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 16,
    borderWidth: 3,
    borderColor: colors.background.primary,
  },
  orderItem: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 20,
    marginLeft: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.white,
    textTransform: 'uppercase',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  restaurantSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  restaurantIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.grey[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
    marginLeft: 6,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  additionalInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  estimatedTimeText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
  driverText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
  orderActions: {
    flexDirection: 'row',
    
    flexWrap: 'wrap',
    gap: 10,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    
    width: '48%',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 6,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 12,
    
    width: '48%',
    borderWidth: 1,
    borderColor: colors.error,
    
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 24,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  shopButtonText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorIconContainer: {
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
})