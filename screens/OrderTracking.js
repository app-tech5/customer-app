import { View, Text, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useRoute, useNavigation } from '@react-navigation/native'
import { getOrderById } from '../api'
import i18n from '../lang/i18n'
import { colors } from '../global'
import { useSettings } from '../contexts/SettingContext'
import Loader from './Loader'
import { OrdersContext } from '../contexts/OrdersContext'
import OpenStreetMap from '../components/restaurantsMap/OpenStreetMap'

export default function OrderTracking() {
  const route = useRoute()
  const navigation = useNavigation()
  const { order: orderParam } = route.params || {}
  const { orders, setOrders } = useContext(OrdersContext)
  const { currency } = useSettings()
  
  const [order, setOrder] = useState(orderParam)
  const [loader, setLoader] = useState(!orderParam)
  const [error, setError] = useState(null)

  const loadOrder = async () => {
    try {
      setLoader(true)
      setError(null)

      const orderId = orderParam?.id || orderParam?._id || order?.id || order?._id
      if (!orderId) {
        throw new Error('Order ID is required')
      }

      if (orderId.startsWith('demo_order_')) {
        console.warn('🎭 Demo order detected, skipping API call');
        setOrder(orderParam)
        return
      }

      const orderData = await getOrderById(orderId)
      setOrder(orderData)
    } catch (err) {
      console.error('Error loading order:', err)
      setError(i18n.t('order.loadingError', 'Error loading order'))

      if (orderParam) {
        setOrder(orderParam)
      }
    } finally {
      setLoader(false)
    }
  }

  useEffect(() => {
    navigation.setOptions({
      title: i18n.t('order.tracking', 'Track Order'),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 10, marginLeft: 5 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      ),
    })
    
    if (orderParam && (orderParam.id || orderParam._id)) {
      
      const orderId = orderParam.id || orderParam._id
      if (!orderId.startsWith('demo_order_')) {
        
        loadOrder()
      } else {
        console.warn('🎭 Demo order detected in useEffect, skipping API refresh')
        setLoader(false)
      }
    }
  }, [navigation])

  useEffect(() => {
    const updatedOrder = orders.find(
      (o) => o._id === order?._id
    )
    if (updatedOrder) {
      setOrder(updatedOrder)
    }
  }, [orders])

  const driverPoint = useMemo(() => {
    const coordinates = order?.driver?.location?.coordinates
    if (Array.isArray(coordinates) && coordinates.length >= 2) {
      const longitude = Number(coordinates[0])
      const latitude = Number(coordinates[1])

      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return { latitude, longitude }
      }
    }

    const latitude = Number(order?.driver?.location?.latitude)
    const longitude = Number(order?.driver?.location?.longitude)

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude }
    }

    return null
  }, [order?.driver?.location])

  const mapRegion = useMemo(() => {
    if (!driverPoint) return null

    return {
      latitude: driverPoint.latitude,
      longitude: driverPoint.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }
  }, [driverPoint])

  const mapMarkers = useMemo(() => {
    if (!driverPoint) return []

    return [
      {
        originalIndex: 0,
        name: i18n.t('order.driver', 'Delivery Driver'),
        latitude: driverPoint.latitude,
        longitude: driverPoint.longitude,
        distance: null,
      },
    ]
  }, [driverPoint])

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

  const getStatusText = (status) => {
    if (!status) return i18n.t('order.status.unknown', 'Unknown')
    return i18n.t(`order.status.${status.toLowerCase()}`, status)
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'time-outline'
      case 'preparing': return 'restaurant-outline'
      case 'out_for_delivery': return 'bicycle-outline'
      case 'delivered': return 'checkmark-circle'
      case 'cancelled': return 'close-circle'
      default: return 'help-circle-outline'
    }
  }

  const getStatusSteps = () => {
    const statuses = ['pending', 'preparing', 'out_for_delivery', 'delivered']
    const currentStatus = order?.status?.toLowerCase()
    const currentIndex = statuses.indexOf(currentStatus)
    
    return statuses.map((status, index) => {
      const isCompleted = index <= currentIndex
      const isCurrent = index === currentIndex
      const isCancelled = currentStatus === 'cancelled'
      
      return {
        status,
        label: getStatusText(status),
        icon: getStatusIcon(status),
        isCompleted: isCancelled ? false : isCompleted,
        isCurrent: isCancelled ? false : isCurrent,
        color: isCompleted ? getStatusColor(status) : colors.grey[400]
      }
    })
  }

  const formatDate = (dateString) => {
    if (!dateString) return i18n.t('common.unknown', 'Unknown')
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return i18n.t('common.unknown', 'Unknown')
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (error) {
      console.error('Error formatting date:', error)
      return i18n.t('common.unknown', 'Unknown')
    }
  }

  const formatEstimatedTime = (dateString) => {
    if (!dateString) return i18n.t('common.unknown', 'Unknown')

    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return i18n.t('common.unknown', 'Unknown')

      const now = new Date()
      const diff = date - now
      const minutes = Math.floor(diff / 60000)

      if (minutes < 0) return i18n.t('order.delivered', 'Delivered')
      if (minutes < 60) return `${minutes} ${i18n.t('order.minutes', 'minutes')}`
      const hours = Math.floor(minutes / 60)
      return `${hours}h ${minutes % 60}${i18n.t('order.minutes', 'min')}`
    } catch (error) {
      console.error('Error formatting estimated time:', error)
      return i18n.t('common.unknown', 'Unknown')
    }
  }

  if (loader) return <Loader />

  if (error || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorTitle}>
            {i18n.t('order.errorTitle', 'Unable to load order')}
          </Text>
          <Text style={styles.errorText}>{error || i18n.t('order.notFound', 'Order not found')}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadOrder}
          >
            <Text style={styles.retryButtonText}>
              {i18n.t('common.retry', 'Retry')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const statusSteps = getStatusSteps()
  const isCancelled = order.status?.toLowerCase() === 'cancelled'

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        <View style={styles.header}>
          <Text style={styles.orderId}>
            {i18n.t('order.orderId', 'Order')} #{String(order.id || order._id || 'Unknown')}
          </Text>
          <Text style={styles.orderDate}>
            {formatDate(order.createdAt || order.date)}
          </Text>
        </View>
        
        <View style={styles.timelineContainer}>
          <Text style={styles.sectionTitle}>
            {i18n.t('order.status.title', 'Order Status')}
          </Text>
          
          {isCancelled ? (
            <View style={styles.cancelledContainer}>
              <Ionicons name="close-circle" size={48} color={colors.error} />
              <Text style={styles.cancelledText}>
                {i18n.t('order.status.cancelled', 'Cancelled')}
              </Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {statusSteps.map((step, index) => (
                <View key={step.status} style={styles.timelineStep}>
                  <View style={styles.timelineStepContent}>
                    <View style={[
                      styles.timelineIconContainer,
                      { backgroundColor: step.isCompleted ? step.color : colors.grey[200] }
                    ]}>
                      <Ionicons 
                        name={step.icon} 
                        size={24} 
                        color={step.isCompleted ? colors.text.white : colors.grey[500]} 
                      />
                    </View>
                    <View style={styles.timelineTextContainer}>
                      <Text style={[
                        styles.timelineLabel,
                        step.isCurrent && styles.timelineLabelCurrent
                      ]}>
                        {step.label}
                      </Text>
                      {step.isCurrent && order.delivery?.estimatedTime && (
                        <Text style={styles.timelineTime}>
                          {i18n.t('order.estimatedArrival', 'Estimated arrival')}: {formatEstimatedTime(order.delivery.estimatedTime)}
                        </Text>
                      )}
                    </View>
                  </View>
                  {index < statusSteps.length - 1 && (
                    <View style={[
                      styles.timelineLine,
                      { backgroundColor: step.isCompleted ? step.color : colors.grey[200] }
                    ]} />
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
        
        {order.restaurant && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>
              {i18n.t('order.restaurant', 'Restaurant')}
            </Text>
            <View style={styles.infoRow}>
              <Ionicons name="restaurant" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                {order.restaurant?.name || order.restaurantName || 'Restaurant inconnu'}
              </Text>
            </View>
            {order.restaurant?.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call" size={20} color={colors.text.secondary} />
                <Text style={styles.infoText}>{order.restaurant.phone}</Text>
              </View>
            )}
            {order.restaurant?.address && (
              <View style={styles.infoRow}>
                <Ionicons name="location" size={20} color={colors.text.secondary} />
                <Text style={styles.infoText}>{order.restaurant.address}</Text>
              </View>
            )}
          </View>
        )}
        
        {order.driver && order.status?.toLowerCase() === 'out_for_delivery' && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>
              {i18n.t('order.driver', 'Delivery Driver')}
            </Text>
            {order.driver?.userId && (
              <>
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                  <Text style={styles.infoText}>
                    {order.driver.userId?.name || i18n.t('order.driverName', 'Driver')}
                  </Text>
                </View>
                {order.driver.userId?.phone && (
                  <View style={styles.infoRow}>
                    <TouchableOpacity 
                      style={styles.phoneButton}
                      onPress={() => {
                        
                        console.warn('Call driver:', order.driver.userId.phone)
                      }}
                    >
                      <Ionicons name="call" size={20} color={colors.primary} />
                      <Text style={styles.phoneText}>{order.driver.userId.phone}</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {order.driver?.vehicle && (
                  <View style={styles.infoRow}>
                    <Ionicons name="car" size={20} color={colors.text.secondary} />
                    <Text style={styles.infoText}>{order.driver.vehicle}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}
        
        {order.delivery?.address && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>
              {i18n.t('order.deliveryAddress', 'Delivery Address')}
            </Text>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <Text style={styles.infoText}>{order.delivery.address}</Text>
            </View>
          </View>
        )}

        {order.status?.toLowerCase() === 'out_for_delivery' && mapRegion && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>
              {i18n.t('order.mapTracking', 'Delivery Map')}
            </Text>
            <View style={styles.mapContainer}>
              <OpenStreetMap
                testID="order-tracking-map"
                initialRegion={mapRegion}
                targetRegion={mapRegion}
                restaurants={mapMarkers}
                focusedOriginalIndex={0}
                onMarkerPress={() => {}}
              />
            </View>
          </View>
        )}
        
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>
            {i18n.t('order.details', 'Order Details')}
          </Text>
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>
              {i18n.t('order.items', 'Items')}:
            </Text>
            <Text style={styles.detailsValue}>
              {order.items?.length || 0}
            </Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>
              {i18n.t('order.subtotal', 'Subtotal')}:
            </Text>
            <Text style={styles.detailsValue}>
              {order.subtotal && !isNaN(order.subtotal) ?
                `${order.subtotal.toFixed(2)}${currency.symbol}` : 'N/A'
              }
            </Text>
          </View>
          {order.delivery?.deliveryFee && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>
                {i18n.t('order.deliveryFee', 'Delivery Fee')}:
              </Text>
              <Text style={styles.detailsValue}>
                {order.delivery.deliveryFee.toFixed(2)}{currency.symbol}
              </Text>
            </View>
          )}
          {order.tax?.amount && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>
                {i18n.t('order.tax', 'Tax')}:
              </Text>
              <Text style={styles.detailsValue}>
                {order.tax.amount.toFixed(2)}{currency.symbol}
              </Text>
            </View>
          )}
          <View style={[styles.detailsRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>
              {i18n.t('order.total', 'Total')}:
            </Text>
            <Text style={styles.totalValue}>
              {order.totalPrice && !isNaN(order.totalPrice) ?
                `${order.totalPrice.toFixed(2)}${currency.symbol}` : 'N/A'
              }
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadOrder}
        >
          <Ionicons name="refresh" size={20} color={colors.primary} />
          <Text style={styles.refreshButtonText}>
            {i18n.t('order.refresh', 'Refresh Status')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    backgroundColor: colors.background.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  timelineContainer: {
    backgroundColor: colors.background.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineStep: {
    marginBottom: 8,
  },
  timelineStepContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  timelineTextContainer: {
    flex: 1,
    paddingTop: 4,
  },
  timelineLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 4,
  },
  timelineLabelCurrent: {
    fontWeight: '600',
    color: colors.primary,
  },
  timelineTime: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  timelineLine: {
    width: 2,
    height: 24,
    marginLeft: 23,
    marginTop: 4,
    marginBottom: 4,
  },
  cancelledContainer: {
    alignItems: 'center',
    padding: 24,
  },
  cancelledText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.error,
    marginTop: 12,
  },
  infoCard: {
    backgroundColor: colors.background.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  mapContainer: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.background.secondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  phoneText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailsLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  detailsValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
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

