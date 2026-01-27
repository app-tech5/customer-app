import { View, Text, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, ScrollView, Alert, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons, MaterialIcons, FontAwesome, Entypo } from '@expo/vector-icons'
import { useSelector, useDispatch } from 'react-redux'
import { getUserPaymentMethods, getUserAddresses } from '../api'
import i18n from '../i18n'
import { colors } from '../global'
import Loader from './Loader'

export default function CheckoutScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.userReducer)

  // Récupération des données depuis les paramètres de navigation
  const cartItems = route.params?.items || []
  const restaurant = route.params?.restaurant || null
  const restaurantName = route.params?.restaurantName || restaurant?.name || ''
  const [addresses, setAddresses] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [loading, setLoading] = useState(true)

  // Calculs des prix
  const subtotal = cartItems.reduce((total, item) => total + (item.totalPrice || item.price), 0)
  const deliveryFee = 2.99
  const taxRate = restaurant?.taxRate || 0.08
  const taxAmount = subtotal * taxRate
  const total = subtotal + deliveryFee + taxAmount

  useEffect(() => {
    loadCheckoutData()

    navigation.setOptions({
      title: i18n.t('checkout.title', 'Checkout'),
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

  const loadCheckoutData = () => {
    try {
      setLoading(true)

      // Les données du restaurant viennent déjà de route.params

      // Utiliser les données utilisateur locales depuis Redux/AsyncStorage
      let addressesData = []
      let paymentData = []

      // Créer l'adresse depuis les données utilisateur (user.address du modèle User)
      if (user.address && user.address.trim()) {
        // Parser l'adresse utilisateur
        let addressParts = user.address.split(',')
        let address = user.address
        let city = ''
        let postalCode = ''
        let country = 'France'

        if (addressParts.length >= 2) {
          address = addressParts[0].trim()
          city = addressParts[1].trim()

          if (addressParts.length >= 3) {
            postalCode = addressParts[2].trim()
          }
        }

        addressesData = [{
          id: 'user_default',
          type: 'home',
          name: 'My Address',
          address: address,
          city: city,
          postalCode: postalCode,
          country: country,
          isDefault: true,
          coordinates: user.location ? {
            lat: user.location.latitude,
            lng: user.location.longitude
          } : null
        }]
      }

      // Utiliser les méthodes de paiement depuis user.paymentMethods (du modèle User)
      paymentData = user.paymentMethods && user.paymentMethods.length > 0
        ? user.paymentMethods.map((method, index) => ({
            id: method._id || `method_${index}`,
            methodType: method.type === 'card' ? 'credit_card' : method.type,
            cardDetails: method.details || {},
            isDefault: index === 0, // Premier comme défaut par défaut
            isActive: true
          }))
        : [{
            id: 'mock_card',
            methodType: 'credit_card',
            cardDetails: {
              cardNumberLast4: '4242',
              cardBrand: 'visa',
              expiryMonth: 12,
              expiryYear: 2025,
              cardholderName: user.name || 'User'
            },
            isDefault: true,
            isActive: true
          }]

      setAddresses(addressesData)

      // Sélectionner automatiquement la première adresse par défaut si disponible
      const defaultAddress = addressesData?.find(addr => addr.isDefault)
      if (defaultAddress) {
        setSelectedAddress(defaultAddress)
      }

      setPaymentMethods(paymentData)

      // Sélectionner automatiquement la méthode de paiement par défaut
      const defaultPayment = paymentData?.find(method => method.isDefault)
      if (defaultPayment) {
        setSelectedPaymentMethod(defaultPayment)
      }

    } catch (error) {
      console.error('Error loading checkout data:', error)
      Alert.alert(i18n.t('common.error', 'Error'), i18n.t('checkout.loadError', 'Failed to load checkout data'))
    } finally {
      setLoading(false)
    }
  }

  const handleAddressSelect = (address) => {
    setSelectedAddress(address)
  }

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method)
  }

  const handlePlaceOrder = () => {
    // Validation
    if (!selectedAddress) {
      Alert.alert(i18n.t('common.error', 'Error'), i18n.t('checkout.selectAddress', 'Please select a delivery address'))
      return
    }

    if (!selectedPaymentMethod) {
      Alert.alert(i18n.t('common.error', 'Error'), i18n.t('checkout.selectPayment', 'Please select a payment method'))
      return
    }

    // Naviguer vers OrderRequest avec les données de commande
    navigation.navigate('OrderRequest', {
      restaurantName,
      restaurant,
      items: cartItems,
      address: selectedAddress,
      paymentMethod: selectedPaymentMethod,
      specialInstructions,
      totals: {
        subtotal,
        deliveryFee,
        taxAmount,
        total
      },
      lat: user.location?.latitude || 48.8566, // Paris par défaut
      lng: user.location?.longitude || 2.3522
    })
  }

  const AddressItem = ({ address, isSelected }) => (
    <TouchableOpacity
      style={[styles.addressItem, isSelected && styles.selectedAddress]}
      onPress={() => handleAddressSelect(address)}
    >
      <View style={styles.addressLeft}>
        <View style={[styles.addressIcon, isSelected && styles.selectedIcon]}>
          <Ionicons
            name={address.type === 'home' ? 'home' : address.type === 'work' ? 'briefcase' : 'location'}
            size={20}
            color={isSelected ? colors.text.white : colors.primary}
          />
        </View>
        <View style={styles.addressInfo}>
          <Text style={[styles.addressName, isSelected && styles.selectedText]}>
            {address.name}
          </Text>
          <Text style={[styles.addressDetails, isSelected && styles.selectedText]}>
            {address.address}
          </Text>
          <Text style={[styles.addressDetails, isSelected && styles.selectedText]}>
            {address.city}, {address.postalCode}
          </Text>
          {address.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>
                {i18n.t('addresses.default', 'Default')}
              </Text>
            </View>
          )}
        </View>
      </View>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
      )}
    </TouchableOpacity>
  )

  const PaymentMethodItem = ({ method, isSelected }) => {
    const getMethodIcon = (type) => {
      switch (type) {
        case 'credit_card':
        case 'debit_card':
          return 'credit-card'
        case 'paypal':
          return 'paypal'
        case 'apple_pay':
          return 'logo-apple'
        case 'google_pay':
          return 'logo-google'
        case 'cash_on_delivery':
          return 'cash'
        default:
          return 'card'
      }
    }

    const getMethodName = (type) => {
      switch (type) {
        case 'credit_card':
          return i18n.t('payment.credit_card', 'Credit Card')
        case 'debit_card':
          return i18n.t('payment.debit_card', 'Debit Card')
        case 'paypal':
          return 'PayPal'
        case 'apple_pay':
          return 'Apple Pay'
        case 'google_pay':
          return 'Google Pay'
        case 'cash_on_delivery':
          return i18n.t('payment.cash', 'Cash')
        default:
          return type
      }
    }

    const IconComponent = method.methodType?.includes('apple') || method.methodType?.includes('google')
      ? Ionicons
      : FontAwesome

    return (
      <TouchableOpacity
        style={[styles.paymentItem, isSelected && styles.selectedPayment]}
        onPress={() => handlePaymentMethodSelect(method)}
      >
        <View style={styles.paymentLeft}>
          <View style={[styles.paymentIcon, isSelected && styles.selectedIcon]}>
            <IconComponent name={getMethodIcon(method.methodType)} size={20} color={isSelected ? colors.text.white : colors.primary} />
          </View>
          <View style={styles.paymentInfo}>
            <Text style={[styles.paymentName, isSelected && styles.selectedText]}>
              {getMethodName(method.methodType)}
            </Text>
            {method.cardDetails?.cardNumberLast4 && (
              <Text style={[styles.paymentDetails, isSelected && styles.selectedText]}>
                •••• {method.cardDetails.cardNumberLast4}
              </Text>
            )}
          </View>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>
    )
  }

  if (loading) return <Loader />

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Restaurant Header */}
        {restaurant && (
          <View style={styles.restaurantHeader}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <Text style={styles.orderItems}>
              {cartItems.length} {cartItems.length === 1 ? i18n.t('cart.item', 'item') : i18n.t('cart.items', 'items')}
            </Text>
          </View>
        )}

        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {i18n.t('checkout.deliveryAddress', 'Delivery Address')}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddressesScreen')}>
              <Text style={styles.manageLink}>
                {i18n.t('checkout.manageAddresses', 'Manage')}
              </Text>
            </TouchableOpacity>
          </View>

          {selectedAddress ? (
            <AddressItem address={selectedAddress} isSelected={true} />
          ) : (
            <TouchableOpacity
              style={styles.emptyAddress}
              onPress={() => navigation.navigate('AddressesScreen')}
            >
              <Ionicons name="location-outline" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyAddressText}>
                {i18n.t('checkout.selectAddress', 'Select delivery address')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {i18n.t('checkout.paymentMethod', 'Payment Method')}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Wallet', { fromAccount: true })}>
              <Text style={styles.manageLink}>
                {i18n.t('checkout.managePayment', 'Manage')}
              </Text>
            </TouchableOpacity>
          </View>

          {selectedPaymentMethod ? (
            <PaymentMethodItem method={selectedPaymentMethod} isSelected={true} />
          ) : (
            <TouchableOpacity
              style={styles.emptyPayment}
              onPress={() => navigation.navigate('Wallet', { fromAccount: true })}
            >
              <Ionicons name="card-outline" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyPaymentText}>
                {i18n.t('checkout.selectPayment', 'Select payment method')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Order Summary */}
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
                ${subtotal.toFixed(2)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {i18n.t('cart.deliveryFee', 'Delivery fee')}
              </Text>
              <Text style={styles.summaryValue}>
                ${deliveryFee.toFixed(2)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {i18n.t('cart.tax', 'Tax')} ({(taxRate * 100).toFixed(1)}%)
              </Text>
              <Text style={styles.summaryValue}>
                ${taxAmount.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>
                {i18n.t('cart.total', 'Total')}
              </Text>
              <Text style={styles.totalValue}>
                ${total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {i18n.t('checkout.specialInstructions', 'Special Instructions')}
          </Text>
          <TouchableOpacity style={styles.instructionsInput}>
            <Text style={styles.instructionsPlaceholder}>
              {specialInstructions || i18n.t('checkout.instructionsPlaceholder', 'Any special instructions for delivery...')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
          <Text style={styles.totalLabel}>{i18n.t('cart.total', 'Total')}</Text>
        </View>

        <TouchableOpacity
          style={[styles.placeOrderButton, (!selectedAddress || !selectedPaymentMethod) && styles.disabledButton]}
          onPress={handlePlaceOrder}
          disabled={!selectedAddress || !selectedPaymentMethod}
        >
          <Text style={styles.placeOrderText}>
            {i18n.t('checkout.placeOrder', 'Place Order')}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={colors.text.white} />
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  manageLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedAddress: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  addressLeft: {
    flexDirection: 'row',
    flex: 1,
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
  selectedIcon: {
    backgroundColor: colors.primary,
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  addressDetails: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  selectedText: {
    color: colors.primary,
  },
  defaultBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.white,
    textTransform: 'uppercase',
  },
  emptyAddress: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyAddressText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 16,
    textAlign: 'center',
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedPayment: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  paymentLeft: {
    flexDirection: 'row',
    flex: 1,
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
  emptyPayment: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyPaymentText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 16,
    textAlign: 'center',
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
  instructionsInput: {
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    minHeight: 60,
    justifyContent: 'center',
  },
  instructionsPlaceholder: {
    fontSize: 14,
    color: colors.text.secondary,
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
  placeOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.white,
    marginRight: 8,
  },
})
