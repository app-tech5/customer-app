import { View, Text, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, ScrollView, Alert, FlatList, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons, FontAwesome } from '@expo/vector-icons'
import { useSelector, useDispatch } from 'react-redux'
import i18n from '../lang/i18n'
import { colors, currency, language } from '../global'
import Loader from './Loader'
import { api } from '../api'
import { config } from '../config'

export default function OrderRequest({ route, navigation }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.userReducer)
  
  const {
    restaurantName,
    restaurant,
    items,
    address,
    paymentMethod,
    specialInstructions,
    totals,
    lat,
    lng
  } = route.params || {}

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    navigation.setOptions({
      title: i18n.t('order.confirmOrder', 'Confirm Order'),
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
  }, [navigation])

  const handleConfirmOrder = async () => {
    let createdOrder = null;

    try {
      setLoading(true);

      const orderItems = items.map(cartItem => ({
        type: cartItem.itemType || 'Menu',
        item: cartItem.item || cartItem.id,
        name: cartItem.name,
        image: cartItem.image,
        price: cartItem.price,
        currency: cartItem.currency || 'EUR',
        quantity: 1,
        total: cartItem.totalPrice || cartItem.price,
        extras: cartItem.extras || [],
        variants: cartItem.variants || []
      }));

      const orderData = {
        user: user.id,
        restaurant: restaurant?._id || restaurant?.id,
        items: orderItems,
        totalPrice: totals.total,
        subtotal: totals.subtotal,
        tax: {
          rate: restaurant?.taxRate || 0.08,
          amount: totals.taxAmount
        },
        status: "pending",
        payment: {
          method: paymentMethod.methodType || "cash",
          status: "pending"
        },
        delivery: {
          type: "delivery",
          address: address.address,
          deliveryFee: totals.deliveryFee,
          specialInstructions: specialInstructions || ""
        }
      };

      if (config.DEMO_MODE) {
        createdOrder = {
          _id: `demo_order_${Date.now()}`,
          id: `demo_order_${Date.now()}`,
          ...orderData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          orderId: `DEMO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        };
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        createdOrder = await api.createOrder(orderData);
      }

      dispatch({ type: 'CLEAR_RESTAURANT', payload: restaurantName });

      navigation.navigate('OrderTracking', {
        order: createdOrder,
        lat,
        lng
      });

    } catch (error) {
      console.error('❌ Error in handleConfirmOrder:', error);
      
      Alert.alert(
        i18n.t('common.error', 'Error'),
        error.message || i18n.t('order.createError', 'Failed to create order. Please try again.'),
        [{ text: i18n.t('common.ok', 'OK') }]
      );
    } finally {
      setLoading(false);
    }
  }

  const OrderItem = ({ item, index }) => (
    <View style={styles.orderItem}>
      <View style={styles.itemImage}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.itemImageContent} />
        ) : (
          <View style={styles.itemImagePlaceholder}>
            <Ionicons name="fast-food" size={24} color={colors.text.secondary} />
          </View>
        )}
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>
          {item.price ? item.price.toLocaleString(language, { style: "currency", currency: currency }) : ""}
        </Text>
        {item.extras && item.extras.length > 0 && (
          <Text style={styles.itemExtras}>
            {item.extras.map(extra => extra.name).join(', ')}
          </Text>
        )}
      </View>
    </View>
  )

  if (loading) return <Loader />

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {}
        <View style={styles.restaurantHeader}>
          <Text style={styles.restaurantName}>{restaurant?.name || restaurantName}</Text>
          <Text style={styles.orderItems}>
            {items?.length || 0} {items?.length === 1 ? i18n.t('cart.item', 'item') : i18n.t('cart.items', 'items')}
          </Text>
        </View>

        {}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {i18n.t('order.yourOrder', 'Your Order')}
          </Text>
          <FlatList
            data={items || []}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => <OrderItem item={item} index={index} />}
            scrollEnabled={false}
          />
        </View>

        {}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {i18n.t('checkout.deliveryAddress', 'Delivery Address')}
          </Text>
          <View style={styles.addressCard}>
            <View style={styles.addressIcon}>
              <Ionicons
                name={address?.type === 'home' ? 'home' : address?.type === 'work' ? 'briefcase' : 'location'}
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.addressInfo}>
              <Text style={styles.addressName}>{address?.name || 'Delivery Address'}</Text>
              <Text style={styles.addressDetails}>
                {address?.address}
              </Text>
              <Text style={styles.addressDetails}>
                {address?.city}, {address?.postalCode}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {i18n.t('checkout.paymentMethod', 'Payment Method')}
          </Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentIcon}>
              {paymentMethod?.methodType?.includes('card') && (
                <Ionicons name="card" size={20} color={colors.primary} />
              )}
              {paymentMethod?.methodType?.includes('paypal') && (
                <FontAwesome name="paypal" size={20} color={colors.primary} />
              )}
              {paymentMethod?.methodType?.includes('cash') && (
                <Ionicons name="cash" size={20} color={colors.primary} />
              )}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentName}>
                {paymentMethod?.cardDetails?.cardBrand ?
                  `${paymentMethod.cardDetails.cardBrand.toUpperCase()} **** ${paymentMethod.cardDetails.cardNumberLast4}` :
                  paymentMethod?.methodType || 'Cash'
                }
              </Text>
              {paymentMethod?.cardDetails?.cardholderName && (
                <Text style={styles.paymentDetails}>
                  {paymentMethod.cardDetails.cardholderName}
                </Text>
              )}
            </View>
          </View>
        </View>
        
        {specialInstructions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {i18n.t('checkout.specialInstructions', 'Special Instructions')}
            </Text>
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsText}>{specialInstructions}</Text>
            </View>
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {i18n.t('checkout.orderSummary', 'Order Summary')}
          </Text>

          <View style={styles.orderSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {i18n.t('cart.subtotal', 'Subtotal')}
              </Text>
              <Text style={styles.summaryValue}>
                {totals?.subtotal ? totals.subtotal.toLocaleString(language, { style: "currency", currency: currency }) : ""}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {i18n.t('cart.deliveryFee', 'Delivery fee')}
              </Text>
              <Text style={styles.summaryValue}>
                {totals?.deliveryFee ? totals.deliveryFee.toLocaleString(language, { style: "currency", currency: currency }) : ""}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {i18n.t('cart.tax', 'Tax')}
              </Text>
              <Text style={styles.summaryValue}>
                {totals?.taxAmount ? totals.taxAmount.toLocaleString(language, { style: "currency", currency: currency }) : ""}
              </Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>
                {i18n.t('cart.total', 'Total')}
              </Text>
              <Text style={styles.totalValue}>
                {totals?.total ? totals.total.toLocaleString(language, { style: "currency", currency: currency }) : ""}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalAmount}>
            {totals?.total ? totals.total.toLocaleString(language, { style: "currency", currency: currency }) : ""}
          </Text>
          <Text style={styles.totalLabel}>{i18n.t('cart.total', 'Total')}</Text>
        </View>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmOrder}
          disabled={loading}
        >
          <Text style={styles.confirmText}>
            {i18n.t('order.confirmOrder', 'Confirm Order')}
          </Text>
          <Ionicons name="checkmark-circle" size={20} color={colors.text.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  restaurantHeader: {
    backgroundColor: colors.background.primary,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  orderItems: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  section: {
    backgroundColor: colors.background.primary,
    margin: 20,
    marginTop: 0,
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
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  itemImageContent: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
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
    fontWeight: '600',
    color: colors.primary,
  },
  itemExtras: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  paymentDetails: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  instructionsCard: {
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  orderSummary: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  totalContainer: {
    flex: 1,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  totalLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.white,
    marginRight: 8,
  },
})