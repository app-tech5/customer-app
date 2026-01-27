import { View, Text, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, ScrollView, Alert, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons, MaterialIcons, FontAwesome, Entypo, AntDesign } from '@expo/vector-icons'
import { useSelector } from 'react-redux'
import { getUserPaymentMethods, getUserTransactions } from '../api'
import i18n from '../i18n'
import { colors } from '../global'
import Loader from './Loader'

export default function WalletScreen({ navigation, route}) {
  const user = useSelector((state) => state.userReducer)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [transactions, setTransactions] = useState([])
  const [balance, setBalance] = useState(0)
  const [loader, setLoader] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadWalletData()

    // navigation.setOptions({
    //   title: i18n.t('wallet.title', 'Wallet'),
    //   headerLeft: () => (
    //     <TouchableOpacity
    //       onPress={() => navigation.toggleDrawer()}
    //       style={{ padding: 10, marginLeft: 5 }}
    //       accessibilityRole="button"
    //       accessibilityLabel="Open menu"
    //     >
    //       <Ionicons name="menu" size={24} color={colors.text.primary} />
    //     </TouchableOpacity>
    //   ),
    // })
    const fromAccount = route.params?.fromAccount;

    navigation.setOptions({
      title: i18n.t('wallet.title', 'Wallet'),
      headerLeft: () =>
        fromAccount ? (
          <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ padding: 10, marginLeft: 5 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.toggleDrawer()}
          style={{ padding: 10, marginLeft: 5 }}>
            <Ionicons name="menu" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        ),
    });
  }, [navigation])

  const loadWalletData = () => {
    try {
      setLoader(true)
      setError(null)

      // Utiliser les données utilisateur locales depuis Redux/AsyncStorage
      let methodsData = []
      let transactionsData = []

      // Utiliser les méthodes de paiement depuis user.paymentMethods (du modèle User)
      methodsData = user.paymentMethods && user.paymentMethods.length > 0
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

      // Pour les transactions, on pourrait utiliser user.orders si disponible
      // Pour l'instant, mock des transactions
      transactionsData = [
        {
          id: '1',
          transaction_type: 'customer_payment',
          amount: 25.99,
          createdAt: new Date(Date.now() - 86400000), // 1 jour ago
          description: 'Order payment'
        },
        {
          id: '2',
          transaction_type: 'refund',
          amount: 15.50,
          createdAt: new Date(Date.now() - 172800000), // 2 jours ago
          description: 'Order refund'
        }
      ]

      setPaymentMethods(methodsData)
      setTransactions(transactionsData.slice(0, 5)) // Afficher seulement les 5 dernières transactions

      // Calculer le solde depuis les transactions mockées
      const calculatedBalance = transactionsData.reduce((acc, transaction) => {
        if (transaction.transaction_type === 'refund' || transaction.transaction_type === 'adjustment') {
          return acc + transaction.amount
        } else if (transaction.transaction_type === 'customer_payment') {
          return acc - transaction.amount
        }
        return acc
      }, 0)

      setBalance(calculatedBalance)
    } catch (err) {
      console.error('Error loading wallet data:', err)
      setError(i18n.t('wallet.loadError', 'Error loading wallet data'))
    } finally {
      setLoader(false)
    }
  }

  const BalanceCard = () => (
    <View style={styles.balanceCard}>
      <View style={styles.balanceHeader}>
        <Text style={styles.balanceLabel}>
          {i18n.t('wallet.balance', 'Balance')}
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadWalletData}
        >
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.balanceAmount}>
        ${balance.toFixed(2)}
      </Text>

      <View style={styles.balanceActions}>
        <TouchableOpacity
          style={styles.balanceActionButton}
          onPress={() => {
            // TODO: Implement add money
            Alert.alert('Not implemented', 'Add money functionality will be implemented')
          }}
        >
          <Ionicons name="add-circle" size={20} color={colors.primary} />
          <Text style={styles.balanceActionText}>
            {i18n.t('wallet.addMoney', 'Add Money')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.balanceActionButton}
          onPress={() => {
            // TODO: Implement send money
            Alert.alert('Not implemented', 'Send money functionality will be implemented')
          }}
        >
          <Ionicons name="send" size={20} color={colors.primary} />
          <Text style={styles.balanceActionText}>
            {i18n.t('wallet.sendMoney', 'Send')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const PaymentMethodItem = ({ method, index }) => {
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
      <View style={[styles.paymentMethodItem, method.isDefault && styles.defaultPaymentMethod]}>
        <View style={styles.paymentMethodLeft}>
          <View style={styles.paymentMethodIcon}>
            <IconComponent name={getMethodIcon(method.methodType)} size={20} color={colors.primary} />
          </View>
          <View style={styles.paymentMethodInfo}>
            <Text style={styles.paymentMethodName}>
              {getMethodName(method.methodType)}
            </Text>
            {method.cardDetails?.cardNumberLast4 && (
              <Text style={styles.paymentMethodDetails}>
                •••• {method.cardDetails.cardNumberLast4}
              </Text>
            )}
            {method.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>
                  {i18n.t('wallet.default', 'Default')}
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.paymentMethodActions}
          onPress={() => {
            // TODO: Show payment method options menu
            Alert.alert(
              i18n.t('wallet.paymentMethodOptions', 'Options'),
              i18n.t('wallet.paymentMethodOptionsMessage', 'Choose an action'),
              [
                { text: i18n.t('common.cancel', 'Cancel'), style: 'cancel' },
                {
                  text: i18n.t('wallet.setAsDefault', 'Set as Default'),
                  onPress: () => {
                    // TODO: Implement set as default
                    Alert.alert('Not implemented', 'Set as default will be implemented')
                  }
                },
                {
                  text: i18n.t('wallet.remove', 'Remove'),
                  style: 'destructive',
                  onPress: () => {
                    // TODO: Implement remove payment method
                    Alert.alert('Not implemented', 'Remove payment method will be implemented')
                  }
                }
              ]
            )
          }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
    )
  }

  const PaymentMethodsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {i18n.t('wallet.paymentMethods', 'Payment Methods')}
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            // TODO: Navigate to add payment method screen
            Alert.alert('Not implemented', 'Add payment method screen will be implemented')
          }}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text style={styles.addButtonText}>
            {i18n.t('wallet.add', 'Add')}
          </Text>
        </TouchableOpacity>
      </View>

      {paymentMethods.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="card-outline" size={64} color={colors.text.secondary} />
          <Text style={styles.emptyStateTitle}>
            {i18n.t('wallet.noPaymentMethods', 'No payment methods')}
          </Text>
          <Text style={styles.emptyStateText}>
            {i18n.t('wallet.addFirstPaymentMethod', 'Add your first payment method to get started')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={paymentMethods}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={({ item, index }) => <PaymentMethodItem method={item} index={index} />}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        />
      )}
    </View>
  )

  const TransactionItem = ({ transaction }) => {
    const getTransactionIcon = (type) => {
      switch (type) {
        case 'customer_payment':
          return 'arrow-up'
        case 'refund':
          return 'arrow-down'
        case 'tip':
          return 'heart'
        case 'adjustment':
          return 'settings'
        default:
          return 'swap-horizontal'
      }
    }

    const getTransactionColor = (type) => {
      switch (type) {
        case 'customer_payment':
          return colors.error
        case 'refund':
        case 'tip':
          return colors.success
        case 'adjustment':
          return colors.warning
        default:
          return colors.primary
      }
    }

    const getTransactionTitle = (type) => {
      switch (type) {
        case 'customer_payment':
          return i18n.t('wallet.payment', 'Payment')
        case 'refund':
          return i18n.t('wallet.refund', 'Refund')
        case 'tip':
          return i18n.t('wallet.tip', 'Tip')
        case 'adjustment':
          return i18n.t('wallet.adjustment', 'Adjustment')
        default:
          return type
      }
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(transaction.transaction_type) + '20' }]}>
            <Ionicons name={getTransactionIcon(transaction.transaction_type)} size={16} color={getTransactionColor(transaction.transaction_type)} />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>
              {getTransactionTitle(transaction.transaction_type)}
            </Text>
            <Text style={styles.transactionDate}>
              {formatDate(transaction.createdAt)}
            </Text>
          </View>
        </View>

        <Text style={[styles.transactionAmount, { color: getTransactionColor(transaction.transaction_type) }]}>
          {transaction.transaction_type === 'customer_payment' ? '-' : '+'}${transaction.amount?.toFixed(2)}
        </Text>
      </View>
    )
  }

  const RecentTransactionsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {i18n.t('wallet.recentTransactions', 'Recent Transactions')}
        </Text>
        <TouchableOpacity
          onPress={() => {
            // TODO: Navigate to full transaction history
            Alert.alert('Not implemented', 'Transaction history screen will be implemented')
          }}
        >
          <Text style={styles.viewAllText}>
            {i18n.t('common.viewAll', 'View All')}
          </Text>
        </TouchableOpacity>
      </View>

      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color={colors.text.secondary} />
          <Text style={styles.emptyStateTitle}>
            {i18n.t('wallet.noTransactions', 'No transactions yet')}
          </Text>
          <Text style={styles.emptyStateText}>
            {i18n.t('wallet.startOrdering', 'Start ordering to see your transaction history')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={({ item }) => <TransactionItem transaction={item} />}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        />
      )}
    </View>
  )

  const PromoSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {i18n.t('wallet.promoCodes', 'Promo Codes & Vouchers')}
      </Text>

      <TouchableOpacity
        style={styles.promoCard}
        onPress={() => {
          // TODO: Navigate to add promo code screen
          Alert.alert('Not implemented', 'Add promo code screen will be implemented')
        }}
      >
        <View style={styles.promoLeft}>
          <Ionicons name="ticket-outline" size={24} color={colors.primary} />
          <View style={styles.promoInfo}>
            <Text style={styles.promoTitle}>
              {i18n.t('wallet.addPromoCode', 'Add Promo Code')}
            </Text>
            <Text style={styles.promoSubtitle}>
              {i18n.t('wallet.saveOnOrders', 'Save on your next orders')}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
      </TouchableOpacity>
    </View>
  )

  if (loader) return <Loader />

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={80} color={colors.error} />
          <Text style={styles.errorTitle}>
            {i18n.t('wallet.errorTitle', 'Unable to load wallet')}
          </Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadWalletData}
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
        {/* Balance Card */}
        <BalanceCard />

        {/* Payment Methods */}
        <PaymentMethodsSection />

        {/* Recent Transactions */}
        <RecentTransactionsSection />

        {/* Promo Codes */}
        <PromoSection />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  balanceCard: {
    backgroundColor: colors.background.primary,
    margin: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  refreshButton: {
    padding: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 20,
  },
  balanceActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  balanceActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  balanceActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 6,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: 8,
  },
  defaultPaymentMethod: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  paymentMethodDetails: {
    fontSize: 14,
    color: colors.text.secondary,
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
  paymentMethodActions: {
    padding: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
  },
  promoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  promoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  promoSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  itemSeparator: {
    height: 8,
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
