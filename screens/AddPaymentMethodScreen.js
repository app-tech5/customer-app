import React, { useEffect, useMemo } from 'react'
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
import { useSelector, useDispatch } from 'react-redux'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n from '../lang/i18n'
import { colors } from '../global'

async function persistPaymentMethods(dispatch, user, next) {
  const updatedUser = { ...user, paymentMethods: next }
  dispatch({ type: 'UPDATE_USER', payload: { paymentMethods: next } })
  try {
    await AsyncStorage.setItem('userData', JSON.stringify(updatedUser))
  } catch (e) {
    console.warn('AsyncStorage userData', e)
  }
}

function methodTypeKey(m) {
  return m.type === 'card' ? 'credit_card' : m.type
}

export default function AddPaymentMethodScreen({ navigation }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.userReducer)

  const existingTypes = useMemo(
    () => new Set((user.paymentMethods || []).map(methodTypeKey)),
    [user.paymentMethods]
  )

  useEffect(() => {
    navigation.setOptions({
      title: i18n.t('wallet.addPaymentMethod'),
    })
  }, [navigation])

  const addSimpleMethod = (type, label) => {
    if (existingTypes.has(type)) {
      Alert.alert(
        i18n.t('wallet.alreadyAdded', 'Already added'),
        i18n.t('wallet.alreadyAddedMessage', 'This payment method is already in your wallet.')
      )
      return
    }
    const next = [
      ...(user.paymentMethods || []),
      {
        _id: `${type}_${Date.now()}`,
        type,
        details: { label },
      },
    ]
    void persistPaymentMethods(dispatch, user, next)
    Alert.alert(i18n.t('wallet.added'), i18n.t('wallet.addedMessage'), [
      { text: i18n.t('common.ok'), onPress: () => navigation.goBack() },
    ])
  }

  const rows = [
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
      onPress: () => addSimpleMethod('paypal', i18n.t('wallet.paypal')),
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
      onPress: () => Alert.alert(i18n.t('common.comingSoon'), i18n.t('wallet.applePaySoon')),
    })
  }

  if (Platform.OS === 'android') {
    rows.splice(1, 0, {
      id: 'google_pay',
      title: i18n.t('wallet.googlePay'),
      subtitle: i18n.t('wallet.googlePaySubtitle'),
      Icon: Ionicons,
      iconName: 'logo-google',
      onPress: () => Alert.alert(i18n.t('common.comingSoon'), i18n.t('wallet.googlePaySoon')),
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
