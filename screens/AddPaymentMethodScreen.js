import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native'
import { Ionicons, FontAwesome } from '@expo/vector-icons'
import { useSelector } from 'react-redux'
import i18n from '../lang/i18n'
import { colors } from '../global'
import { usePaymentMethods } from '../contexts/PaymentMethodsContext'
import { useSettings } from '../contexts/SettingContext'
import { getUserTransactions } from '../api'

export default function AddPaymentMethodScreen({ navigation }) {
  const user = useSelector((state) => state.userReducer)
  const { paymentMethods, addPaymentMethod } = usePaymentMethods()
  const { currency } = useSettings()
  const currentUserId = user?.userId || user?.id
  const [walletBalance, setWalletBalance] = useState(0)

  const existingTypes = useMemo(
    () => new Set(paymentMethods.map((method) => method.methodType)),
    [paymentMethods]
  )

  useEffect(() => {
    navigation.setOptions({
      title: i18n.t('wallet.addPaymentMethod'),
    })
  }, [navigation])

  const loadWalletBalance = useCallback(async () => {
    try {
      const response = await getUserTransactions()
      setWalletBalance(Number(response?.balance) || 0)
    } catch {
      setWalletBalance(0)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadWalletBalance()
    }, [loadWalletBalance])
  )

  const addWalletBalanceMethod = async () => {
    if (existingTypes.has('platform_credit')) {
      Alert.alert(
        i18n.t('wallet.alreadyAdded', 'Already added'),
        i18n.t('wallet.alreadyAddedMessage', 'This payment method is already in your wallet.')
      )
      return
    }

    if (walletBalance <= 0) {
      Alert.alert(
        i18n.t('wallet.balanceEmptyTitle'),
        i18n.t('wallet.balanceEmptyMessage'),
        [
          { text: i18n.t('common.cancel'), style: 'cancel' },
          {
            text: i18n.t('wallet.addMoney'),
            onPress: () => navigation.navigate('AddMoney'),
          },
        ]
      )
      return
    }

    await addPaymentMethod({
      id: `platform_credit_${currentUserId}`,
      user: currentUserId,
      methodType: 'platform_credit',
      cardDetails: { label: i18n.t('payment.platform_credit') },
      walletBalance: `${currency.symbol}${walletBalance.toFixed(2)}`,
    })

    Alert.alert(i18n.t('wallet.added'), i18n.t('wallet.walletBalanceAdded'), [
      { text: i18n.t('common.ok'), onPress: () => navigation.navigate('Wallet') },
    ])
  }

  const addSimpleMethod = (type, label) => {
    if (existingTypes.has(type)) {
      Alert.alert(
        i18n.t('wallet.alreadyAdded', 'Already added'),
        i18n.t('wallet.alreadyAddedMessage', 'This payment method is already in your wallet.')
      )
      return
    }

    addPaymentMethod({
      id: `${type}_${Date.now()}`,
      user: user?.id,
      methodType: type,
      cardDetails: { label },
      paypalEmail: type === 'paypal' ? label : null,
    })

    Alert.alert(i18n.t('wallet.added'), i18n.t('wallet.addedMessage'), [
      { text: i18n.t('common.ok'), onPress: () => navigation.goBack() },
    ])
  }
  
  const rows = [
    {
      id: 'platform_credit',
      title: i18n.t('payment.platform_credit'),
      subtitle: walletBalance > 0
        ? i18n.t('wallet.walletBalanceSubtitle', {
            amount: `${currency.symbol}${walletBalance.toFixed(2)}`,
          })
        : i18n.t('wallet.walletBalanceEmpty'),
      Icon: Ionicons,
      iconName: 'wallet-outline',
      onPress: addWalletBalanceMethod,
    },
    {
      id: 'card',
      title: i18n.t('wallet.addCreditOrDebit'),
      subtitle: i18n.t('wallet.addCardSubtitle'),
      Icon: FontAwesome,
      iconName: 'credit-card',
      onPress: () => navigation.navigate('AddCard'),
    },
    {
      id: 'paypal',
      title: i18n.t('wallet.paypal'),
      subtitle: i18n.t('wallet.paypalSubtitle'),
      Icon: FontAwesome,
      iconName: 'paypal',
      onPress: () => addSimpleMethod('paypal',  user?.email),
    },
    {
      id: 'cash',
      title: i18n.t('payment.cash'),
      subtitle: i18n.t('wallet.cashSubtitle'),
      Icon: FontAwesome,
      iconName: 'money',
      onPress: () => addSimpleMethod('cash_on_delivery', i18n.t('payment.cash')),
    },
  ]

  if (Platform.OS === 'ios') {
    rows.splice(1, 0, {
      id: 'apple_pay',
      title: i18n.t('wallet.applePay'),
      subtitle: i18n.t('wallet.applePaySubtitle'),
      Icon: Ionicons,
      iconName: 'logo-apple',
      onPress: () => addSimpleMethod('apple_pay'),
    })
  }

  if (Platform.OS === 'android') {
    rows.splice(1, 0, {
      id: 'google_pay',
      title: i18n.t('wallet.googlePay'),
      subtitle: i18n.t('wallet.googlePaySubtitle'),
      Icon: Ionicons,
      iconName: 'logo-google',
      onPress: () => addSimpleMethod('google_pay'),
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.hint}>{i18n.t('wallet.addPaymentMethodHint')}</Text>
        {rows.map((row, index) => {
          const { Icon, iconName } = row
          const isLast = index === rows.length - 1
          return (
            <TouchableOpacity
              key={row.id}
              style={[styles.row, !isLast && styles.rowMargin]}
              onPress={row.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.rowIcon}>
                <Icon name={iconName} size={22} color={colors.primary} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{row.title}</Text>
                <Text style={styles.rowSub}>{row.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.text.secondary} />
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  hint: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  rowMargin: {
    marginBottom: 12,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  rowSub: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
})
