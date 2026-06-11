import { View, Text, Image, FlatList, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useRoute, useNavigation } from '@react-navigation/native'
import { getOrderById } from '../api'
import i18n from '../lang/i18n'
import { colors } from '../global'
import { useSettings } from '../contexts/SettingContext'
import Loader from './Loader'
import { config } from '../config'

export default function OrderDetails() {
  const [order, setOrder] = useState(null)
  const [loader, setLoader] = useState(true)
  const [error, setError] = useState(null)
  const route = useRoute()
  const navigation = useNavigation()
  const { currency } = useSettings()

  const orderData = route.params?.order

  useEffect(() => {
    if (orderData) {
      
      setOrder(orderData)
      setLoader(false)
    } else {
      
      loadOrderDetails()
    }
    
    navigation.setOptions({
      title: i18n.t('order.details', 'Order Details'),
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
  }, [navigation, orderData])

  const loadOrderDetails = async () => {
    try {
      setLoader(true)
      setError(null)

      const orderId = route.params?.id || route.params?.order?.id || route.params?.order?._id
      if (!orderId) {
        throw new Error('Order ID not provided')
      }

      const orderDetails = await getOrderById(orderId)
      setOrder(orderDetails)
    } catch (err) {
      console.error('Error loading order details:', err)
      setError(i18n.t('order.loadingError', 'Error loading order details'))
    } finally {
      setLoader(false)
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

  const OrderHeader = () => (
    <View style={styles.headerContainer}>
      <Image
        source={{ uri: order.restaurant?.image || config.assetUrls.placeholder.orderDetailsHero400x200 }}
        style={styles.restaurantImage}
        resizeMode="cover"
      />
      <View style={styles.headerOverlay}>
        <Text style={styles.restaurantName}>{order.restaurant?.name || 'Restaurant'}</Text>
        <View style={styles.statusBadge}>
          <Ionicons name={getStatusIcon(order.status)} size={16} color={colors.text.white} />
          <Text style={styles.statusText}>
            {getStatusText(order.status)}
          </Text>
        </View>
      </View>
    </View>
  )

  const OrderSummary = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>
          {i18n.t('order.orderDetails', 'Order Details')}
        </Text>
        <Text style={styles.orderId}>
          #{order.id || order._id}
        </Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
          <Text style={styles.summaryLabel}>{i18n.t('order.date', 'Date')}</Text>
          <Text style={styles.summaryValue}>{formatDate(order.createdAt || order.date)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
          <Text style={styles.summaryLabel}>{i18n.t('order.timeAgo', 'Time')}</Text>
          <Text style={styles.summaryValue}>{formatTimeAgo(order.createdAt || order.date)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name="bag-outline" size={20} color={colors.text.secondary} />
          <Text style={styles.summaryLabel}>{i18n.t('order.items', 'Items')}</Text>
          <Text style={styles.summaryValue}>{order.items?.length || 0}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name="cash-outline" size={20} color={colors.text.secondary} />
          <Text style={styles.summaryLabel}>{i18n.t('order.total', 'Total')}</Text>
          <Text style={styles.summaryValue}>
            {order.totalPrice != null && !isNaN(order.totalPrice) ?
              `${order.totalPrice.toFixed(2)}${currency.symbol}` : 'N/A'
            }
          </Text>
        </View>
      </View>
    </View>
  )

  const renderOrderItem = ({ item, index }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <Image
          source={{ uri: item.image || config.assetUrls.placeholder.orderDetailsItem80 }}
          style={styles.itemImage}
          resizeMode="cover"
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>
            {item.price != null && !isNaN(item.price) ?
              `${item.price.toFixed(2)}${currency.symbol}` : 'N/A'
            }
          </Text>
        </View>
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityText}>{i18n.t('order.quantityPrefix')}{item.quantity}</Text>
        </View>
      </View>
      
      {item.extras && item.extras.length > 0 && (
        <View style={styles.extrasContainer}>
          <Text style={styles.extrasTitle}>{i18n.t('order.extras', 'Extras')}:</Text>
          {item.extras.map((extra, extraIndex) => (
            <View key={extraIndex} style={styles.extraItem}>
              <Text style={styles.extraName}>{extra.name}</Text>
              <Text style={styles.extraPrice}>
                +{extra.price && !isNaN(extra.price) ?
                  `${extra.price.toFixed(2)}${currency.symbol}` : 'N/A'
                } {i18n.t('order.quantityPrefix')}{extra.quantity}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      {item.variants && item.variants.length > 0 && (
        <View style={styles.variantsContainer}>
          <Text style={styles.variantsTitle}>{i18n.t('order.variants', 'Variants')}:</Text>
          {item.variants.map((variant, variantIndex) => (
            <View key={variantIndex} style={styles.variantItem}>
              <Text style={styles.variantName}>{variant.name}</Text>
              <Text style={styles.variantDetails}>
                {variant.size} - {variant.price && !isNaN(variant.price) ?
                  `${variant.price.toFixed(2)}${currency.symbol}` : 'N/A'
                }
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.itemTotal}>
        <Text style={styles.itemTotalText}>
          {i18n.t('order.subtotal', 'Subtotal')}:           {item.total != null && !isNaN(item.total) ?
            `${item.total.toFixed(2)}${currency.symbol}` : 'N/A'
          }
        </Text>
      </View>
    </View>
  )

  const DeliveryInfo = () => (
    <View style={styles.deliveryContainer}>
      <Text style={styles.sectionTitle}>
        {i18n.t('order.deliveryInfo', 'Delivery Information')}
      </Text>

      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Ionicons
            name={order.delivery?.type === 'delivery' ? "bicycle-outline" : "storefront-outline"}
            size={20}
            color={colors.primary}
          />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>
              {i18n.t('order.deliveryType', 'Delivery Type')}
            </Text>
            <Text style={styles.infoValue}>
              {i18n.t(`delivery.${order.delivery?.type}`, order.delivery?.type || 'N/A')}
            </Text>
          </View>
        </View>

        {order.delivery?.address && (
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                {i18n.t('order.deliveryAddress', 'Delivery Address')}
              </Text>
              <Text style={styles.infoValue}>{order.delivery.address}</Text>
            </View>
          </View>
        )}

        {order.delivery?.estimatedTime && (
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                {i18n.t('order.estimatedTime', 'Estimated Time')}
              </Text>
              <Text style={styles.infoValue}>
                {formatEstimatedTime(order.delivery.estimatedTime)}
              </Text>
            </View>
          </View>
        )}

        {order.delivery?.deliveryFee != null && !isNaN(order.delivery.deliveryFee) && (
          <View style={styles.infoItem}>
            <Ionicons name="cash-outline" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                {i18n.t('order.deliveryFee', 'Delivery Fee')}
              </Text>
              <Text style={styles.infoValue}>
                {`${order.delivery.deliveryFee.toFixed(2)}${currency.symbol}`}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  )

  const PaymentInfo = () => (
    <View style={styles.paymentContainer}>
      <Text style={styles.sectionTitle}>
        {i18n.t('order.paymentInfo', 'Payment Information')}
      </Text>

      <View style={styles.paymentGrid}>
        <View style={styles.paymentItem}>
          <Ionicons name="card-outline" size={20} color={colors.primary} />
          <View style={styles.paymentContent}>
            <Text style={styles.paymentLabel}>
              {i18n.t('order.paymentMethod', 'Payment Method')}
            </Text>
            <Text style={styles.paymentValue}>
              {i18n.t(`payment.${order.payment?.method}`, order.payment?.method || 'N/A')}
            </Text>
          </View>
        </View>

        <View style={styles.paymentItem}>
          <Ionicons
            name={order.payment?.status === 'paid' ? "checkmark-circle" : "time-outline"}
            size={20}
            color={order.payment?.status === 'paid' ? colors.success : colors.warning}
          />
          <View style={styles.paymentContent}>
            <Text style={styles.paymentLabel}>
              {i18n.t('order.paymentStatus', 'Payment Status')}
            </Text>
            <Text style={[
              styles.paymentValue,
              { color: order.payment?.status === 'paid' ? colors.success : colors.warning }
            ]}>
              {i18n.t(`payment.status.${order.payment?.status}`, order.payment?.status || 'N/A')}
            </Text>
          </View>
        </View>

        {order.payment?.transactionId && (
          <View style={styles.paymentItem}>
            <Ionicons name="receipt-outline" size={20} color={colors.primary} />
            <View style={styles.paymentContent}>
              <Text style={styles.paymentLabel}>
                {i18n.t('order.transactionId', 'Transaction ID')}
              </Text>
              <Text style={styles.paymentValue}>{order.payment.transactionId}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  )

  const OrderTotal = () => (
    <View style={styles.totalContainer}>
      <Text style={styles.sectionTitle}>
        {i18n.t('order.orderSummary', 'Order Summary')}
      </Text>

      <View style={styles.totalBreakdown}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{i18n.t('order.subtotal', 'Subtotal')}</Text>
          <Text style={styles.totalValue}>
            {order.subtotal != null && !isNaN(order.subtotal) ?
              `${order.subtotal.toFixed(2)}${currency.symbol}` : 'N/A'
            }
          </Text>
        </View>

        {order.delivery?.deliveryFee != null && !isNaN(order.delivery.deliveryFee) && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{i18n.t('order.deliveryFee', 'Delivery Fee')}</Text>
            <Text style={styles.totalValue}>
              {`${order.delivery.deliveryFee.toFixed(2)}${currency.symbol}`}
            </Text>
          </View>
        )}

        {order.tax?.amount != null && !isNaN(order.tax.amount) && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {i18n.t('order.tax', 'Tax')} ({order.tax.rate != null ? (order.tax.rate * 100).toFixed(1) : 0}%)
            </Text>
            <Text style={styles.totalValue}>
              {`${order.tax.amount.toFixed(2)}${currency.symbol}`}
            </Text>
          </View>
        )}

        <View style={[styles.totalRow, styles.finalTotal]}>
          <Text style={styles.finalTotalLabel}>{i18n.t('order.total', 'Total')}</Text>
          <Text style={styles.finalTotalValue}>
            {order.totalPrice != null && !isNaN(order.totalPrice) ?
              `${order.totalPrice.toFixed(2)}${currency.symbol}` : 'N/A'
            }
          </Text>
        </View>
      </View>
    </View>
  )

  const ActionButtons = () => (
    <View style={styles.actionsContainer}>
      {order.status?.toLowerCase() === 'pending' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            Alert.alert(
              i18n.t('order.confirmCancel', 'Confirm Cancellation'),
              i18n.t('order.cancelMessage', 'Are you sure you want to cancel this order?'),
              [
                { text: i18n.t('common.cancel', 'Cancel'), style: 'cancel' },
                {
                  text: i18n.t('order.confirmCancelButton', 'Cancel Order'),
                  style: 'destructive',
                  onPress: () => {
                    
                    Alert.alert('Not implemented', 'Cancel order functionality will be implemented')
                  }
                }
              ]
            )
          }}
        >
          <Ionicons name="close-circle" size={20} color={colors.error} />
          <Text style={styles.cancelButtonText}>
            {i18n.t('order.cancel', 'Cancel Order')}
          </Text>
        </TouchableOpacity>
      )}

      {['preparing', 'out_for_delivery'].includes(order.status?.toLowerCase()) && (
        <TouchableOpacity
          style={styles.trackButton}
          onPress={() => navigation.navigate('OrderTracking', { order })}
        >
          <Ionicons name="location" size={20} color={colors.primary} />
          <Text style={styles.trackButtonText}>
            {i18n.t('order.track', 'Track Order')}
          </Text>
        </TouchableOpacity>
      )}

      {order.status?.toLowerCase() === 'delivered' && (
        <TouchableOpacity
          style={styles.reorderButton}
          onPress={() => {
            
            Alert.alert('Not implemented', 'Reorder functionality will be implemented')
          }}
        >
          <Ionicons name="refresh" size={20} color={colors.primary} />
          <Text style={styles.reorderButtonText}>
            {i18n.t('order.reorder', 'Reorder')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )

  if (loader) return <Loader />

  if (error || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={80} color={colors.error} />
          <Text style={styles.errorTitle}>
            {i18n.t('order.errorTitle', 'Unable to load order')}
          </Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadOrderDetails}
          >
            <Ionicons name="refresh" size={20} color={colors.text.white} />
            <Text style={styles.retryButtonText}>
              {i18n.t('common.retry', 'Retry')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      <ScrollView showsVerticalScrollIndicator={false}>
        
        <OrderHeader />
        
        <OrderSummary />
        
        <View style={styles.itemsContainer}>
          <Text style={styles.sectionTitle}>
            {i18n.t('order.items', 'Items')}
          </Text>
    <FlatList  
            data={order.items || []}
            keyExtractor={(item, index) => String(index)}
            renderItem={renderOrderItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          />
        </View>
        
        <DeliveryInfo />
        
        <PaymentInfo />
        
        <OrderTotal />
        
        <ActionButtons />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  headerContainer: {
    position: 'relative',
    height: 200,
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.white,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.white,
    textTransform: 'uppercase',
    marginLeft: 6,
  },
  summaryContainer: {
    backgroundColor: colors.background.primary,
    margin: 20,
    marginBottom: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryHeader: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginTop: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  summaryItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  itemsContainer: {
    backgroundColor: colors.background.primary,
    margin: 20,
    marginBottom: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  itemContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  quantityContainer: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quantityText: {
    color: colors.text.white,
    fontSize: 12,
    fontWeight: '600',
  },
  extrasContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  extrasTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  extraItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  extraName: {
    fontSize: 12,
    color: colors.text.secondary,
    flex: 1,
  },
  extraPrice: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  variantsContainer: {
    marginTop: 8,
  },
  variantsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  variantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  variantName: {
    fontSize: 12,
    color: colors.text.secondary,
    flex: 1,
  },
  variantDetails: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  itemTotal: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    alignItems: 'flex-end',
  },
  itemTotalText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  itemSeparator: {
    height: 12,
  },
  deliveryContainer: {
    backgroundColor: colors.background.primary,
    margin: 20,
    marginBottom: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  paymentContainer: {
    backgroundColor: colors.background.primary,
    margin: 20,
    marginBottom: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  paymentGrid: {
    gap: 16,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  paymentContent: {
    flex: 1,
    marginLeft: 12,
  },
  paymentLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalContainer: {
    backgroundColor: colors.background.primary,
    margin: 20,
    marginBottom: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  totalBreakdown: {
    gap: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  finalTotal: {
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: colors.border.light,
  },
  finalTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  finalTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  actionsContainer: {
    margin: 20,
    marginBottom: 40,
    gap: 12,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 8,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  trackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  reorderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.white,
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: 24,
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