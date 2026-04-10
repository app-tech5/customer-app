import { View, Text, StatusBar, StyleSheet, TouchableOpacity, ScrollView, Alert, FlatList, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useSelector, useDispatch } from 'react-redux'
import { SafeAreaView } from 'react-native-safe-area-context'
import i18n from '../lang/i18n'
import { colors, language } from '../global'
import Loader from './Loader'
import { api, createStripePaymentIntent } from '../api'
import { config } from '../config'
import { usePaymentMethods } from '../contexts/PaymentMethodsContext'
import { useSettings } from '../contexts/SettingContext'
import PaymentMethodItem from '../components/PaymentMethodItem'
import CheckoutTotalActionFooter from '../components/CheckoutTotalActionFooter'
import { confirmPayment } from '@stripe/stripe-react-native'

export default function OrderRequest({ route, navigation }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.userReducer)
  const currentUserId = user?.userId
  const { paymentMethods } = usePaymentMethods()
  const { currency: appCurrency } = useSettings()
  const currencyCode = appCurrency?.code || 'EUR'
  const stripeCurrency = currencyCode.toLowerCase().slice(0, 3)

  const {
    restaurantName,
    restaurant,
    items,
    address,
    specialInstructions,
    totals,
    lat,
    lng
  } = route.params || {}
  const paymentMethod =
    paymentMethods.find((method) => method.isDefault) ||
    route.params?.paymentMethod ||
    null

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

    const defaultPaymentMethod = paymentMethods.find(
      (method) => method.isDefault
    );

    if (!defaultPaymentMethod) {
      throw new Error("No default payment method found");
    }

    const paymentMethodId = defaultPaymentMethod.id;

    console.log('💳 Processing payment with method ID:', defaultPaymentMethod);

    try {
      setLoading(true);

      if (!config.DEMO_MODE) {
        const response = await createStripePaymentIntent({
          amount: Math.round(Number(totals?.total) * 100),
          currency: stripeCurrency,
        });
        const clientSecret = response.client_secret;
        const { paymentIntent, error } = await confirmPayment(clientSecret, {
          paymentMethodType: 'Card',
          paymentMethodData:{
            paymentMethodId
          }
        });
        if (error) {
          throw new Error(error.message || i18n.t('payment.confirmationError', 'Payment confirmation failed. Please try again.'));
        }
        if (paymentIntent.status !== 'succeeded') {
          console.log('❌ Payment failed with status:', paymentIntent);
          throw new Error(i18n.t('payment.notSuccessful', 'Payment was not successful. Please try again.'));
        }

      }

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
        user: currentUserId,
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
          method: paymentMethod?.methodType || "cash",
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

      navigation.navigate('OrderStatusFlow', {
        screen: 'OrderTracking',
        params: {
          order: createdOrder,
          lat,
          lng
        }
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
          {item.price ? item.price.toLocaleString(language, { style: "currency", currency: currencyCode }) : ""}
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
        { }
        <View style={styles.restaurantHeader}>
          <Text style={styles.restaurantName}>{restaurant?.name || restaurantName}</Text>
          <Text style={styles.orderItems}>
            {items?.length || 0} {items?.length === 1 ? i18n.t('cart.item', 'item') : i18n.t('cart.items', 'items')}
          </Text>
        </View>

        { }
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

        { }
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
          {paymentMethod ? (
            <PaymentMethodItem
              method={paymentMethod}
              variant="checkout"
              isSelected={true}
            />
          ) : (
            <Text style={styles.addressDetails}>
              {i18n.t('checkout.selectPayment', 'Select payment method')}
            </Text>
          )}
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
                {totals?.subtotal ? totals.subtotal.toLocaleString(language, { style: "currency", currency: currencyCode }) : ""}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {i18n.t('cart.deliveryFee', 'Delivery fee')}
              </Text>
              <Text style={styles.summaryValue}>
                {totals?.deliveryFee ? totals.deliveryFee.toLocaleString(language, { style: "currency", currency: currencyCode }) : ""}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {i18n.t('cart.tax', 'Tax')}
              </Text>
              <Text style={styles.summaryValue}>
                {totals?.taxAmount ? totals.taxAmount.toLocaleString(language, { style: "currency", currency: currencyCode }) : ""}
              </Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>
                {i18n.t('cart.total', 'Total')}
              </Text>
              <Text style={styles.totalValue}>
                {totals?.total ? totals.total.toLocaleString(language, { style: "currency", currency: currencyCode }) : ""}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <CheckoutTotalActionFooter
        totalAmount={
          totals?.total ? totals.total.toLocaleString(language, { style: 'currency', currency: currencyCode }) : ''
        }
        totalCaption={i18n.t('cart.total', 'Total')}
        actionLabel={i18n.t('order.confirmOrder', 'Confirm Order')}
        onActionPress={handleConfirmOrder}
        disabled={loading}
        actionIcon="checkmark-circle"
        variant="success"
      />
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
})