import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useSelector } from 'react-redux'
import { confirmPayment, confirmPlatformPayPayment } from '@stripe/stripe-react-native'
import i18n from '../lang/i18n'
import { colors } from '../global'
import { config } from '../config'
import { usePaymentMethods } from '../contexts/PaymentMethodsContext'
import { useSettings } from '../contexts/SettingContext'
import PaymentMethodItem from '../components/PaymentMethodItem'
import CheckoutPaymentSelector from '../components/CheckoutPaymentSelector'
import CheckoutTotalActionFooter from '../components/CheckoutTotalActionFooter'
import { addMoneyToWallet, createStripePaymentIntent, updatePaymentMethod } from '../api'

const TOP_UP_AMOUNTS = [10, 20, 50]

export default function AddMoneyScreen({ navigation }) {
  const user = useSelector((state) => state.userReducer)
  const userId = user?.id || user?.userId
  const { paymentMethods } = usePaymentMethods()
  const { currency } = useSettings()
  const currencyCode = currency?.code || 'EUR'
  const stripeCurrency = currencyCode.toLowerCase().slice(0, 3)

  const [amount, setAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState(
    paymentMethods.find((method) => method.isDefault) || paymentMethods[0] || null
  )
  const [selectorVisible, setSelectorVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  const payableMethods = paymentMethods.filter(
    (method) => method.methodType !== 'cash_on_delivery'
  )

  useEffect(() => {
    navigation.setOptions({
      title: i18n.t('wallet.addMoney'),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 10, marginLeft: 5 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      ),
    })
  }, [navigation])

  useEffect(() => {
    if (!selectedMethod && payableMethods.length > 0) {
      setSelectedMethod(payableMethods.find((method) => method.isDefault) || payableMethods[0])
    }
  }, [payableMethods, selectedMethod])

  const confirmStripePayment = async (paymentMethod, numericAmount) => {
    const response = await createStripePaymentIntent({
      amount: Math.round(numericAmount * 100),
      currency: stripeCurrency,
    })
    const clientSecret = response.client_secret
    const paymentMethodId = paymentMethod.id
    let paymentIntent
    let error

    if (paymentMethod.methodType === 'google_pay') {
      ({ paymentIntent, error } = await confirmPlatformPayPayment(clientSecret, {
        googlePay: {
          testEnv: true,
          merchantName: 'Good Foods',
          countryCode: 'FR',
          currencyCode: stripeCurrency.toUpperCase(),
        },
      }))
    } else if (paymentMethod.methodType === 'apple_pay') {
      ({ paymentIntent, error } = await confirmPlatformPayPayment(clientSecret, {
        applePay: {
          testEnv: true,
          merchantName: 'Good Foods',
          countryCode: 'FR',
          currencyCode: stripeCurrency.toUpperCase(),
        },
      }))
    } else if (paymentMethod.methodType === 'paypal') {
      ({ paymentIntent, error } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Paypal',
        paymentMethodData: { paymentMethodId },
      }))
    } else {
      ({ paymentIntent, error } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: { paymentMethodId },
      }))
    }

    if (error) {
      throw new Error(error.message || i18n.t('payment.confirmationError'))
    }
    if (paymentIntent.status !== 'Succeeded') {
      throw new Error(i18n.t('payment.notSuccessful'))
    }

    if (paymentMethod.verificationStatus === 'unverified' && paymentMethod._id) {
      await updatePaymentMethod(paymentMethod._id, {
        verificationStatus: 'verified',
        verificationDate: new Date(),
      })
    }
  }

  const handleAddMoney = async () => {
    const numericAmount = Number.parseFloat(amount)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert(i18n.t('common.error'), i18n.t('wallet.addMoneyInvalidAmount'))
      return
    }

    if (!selectedMethod) {
      Alert.alert(i18n.t('common.error'), i18n.t('wallet.addMoneyNoPaymentMethod'))
      return
    }

    setLoading(true)

    try {
      if (!config.DEMO_MODE) {
        await confirmStripePayment(selectedMethod, numericAmount)
      }

      await addMoneyToWallet({
        user: userId,
        transaction_type: 'customer_top_up',
        amount: numericAmount,
        currency: 'USD',
        status: 'completed',
      })

      Alert.alert(i18n.t('wallet.addMoneySuccessTitle'), i18n.t('wallet.addMoneySuccessMessage'), [
        { text: i18n.t('common.ok'), onPress: () => navigation.goBack() },
      ])
    } catch (error) {
      Alert.alert(
        i18n.t('common.error'),
        error.message || i18n.t('wallet.addMoneyError')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>{i18n.t('wallet.addMoneyAmountLabel')}</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={colors.text.secondary}
        />

        <View style={styles.amountRow}>
          {TOP_UP_AMOUNTS.map((value) => (
            <TouchableOpacity
              key={value}
              style={styles.amountChip}
              onPress={() => setAmount(String(value))}
            >
              <Text style={styles.amountChipText}>
                {currency.symbol}{value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{i18n.t('checkout.paymentMethod')}</Text>
        {selectedMethod ? (
          <PaymentMethodItem
            method={selectedMethod}
            variant="checkout"
            isSelected
            onPress={() => setSelectorVisible(true)}
          />
        ) : (
          <TouchableOpacity style={styles.emptyMethod} onPress={() => setSelectorVisible(true)}>
            <Text style={styles.emptyMethodText}>
              {i18n.t('wallet.addMoneyNoPaymentMethod')}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <CheckoutTotalActionFooter
        totalAmount={`${currency.symbol}${Number.parseFloat(amount || 0).toFixed(2)}`}
        totalCaption={i18n.t('wallet.addMoney')}
        actionLabel={i18n.t('wallet.addMoneyConfirm')}
        onActionPress={handleAddMoney}
        disabled={loading}
        actionIcon="add-circle"
      />

      <CheckoutPaymentSelector
        visible={selectorVisible}
        paymentMethods={payableMethods}
        activePaymentMethod={selectedMethod}
        onSelect={setSelectedMethod}
        onClose={() => setSelectorVisible(false)}
        onManage={() => {
          setSelectorVisible(false)
          navigation.navigate('AddPaymentMethod')
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  amountChip: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  amountChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyMethod: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
  },
  emptyMethodText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
})
