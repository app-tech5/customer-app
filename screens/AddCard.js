import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import { CardField, StripeProvider } from '@stripe/stripe-react-native'
import { Ionicons, FontAwesome } from '@expo/vector-icons'
import { useSelector, useDispatch } from 'react-redux'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n from '../lang/i18n'
import { colors } from '../global'

function digitsOnly(s) {
  return (s || '').replace(/\D/g, '')
}

function validLuhn(numStr) {
  const value = digitsOnly(numStr)
  if (value.length < 13) return false
  let nCheck = 0
  let bEven = false
  for (let n = value.length - 1; n >= 0; n--) {
    let nDigit = parseInt(value.charAt(n), 10)
    if (bEven) {
      nDigit *= 2
      if (nDigit > 9) nDigit -= 9
    }
    nCheck += nDigit
    bEven = !bEven
  }
  return nCheck % 10 === 0
}

function formatCardNumberDisplay(digits) {
  const d = digits.slice(0, 19)
  const isAmex = d.startsWith('34') || d.startsWith('37')
  if (isAmex) {
    const a = d.slice(0, 4)
    const b = d.slice(4, 10)
    const c = d.slice(10, 15)
    return [a, b, c].filter(Boolean).join(' ')
  }
  return d.replace(/(.{4})/g, '$1 ').trim()
}

function cardBrandLabel(digits) {
  const d = digits
  if (d.startsWith('4')) return 'Visa'
  const two = parseInt(d.slice(0, 2), 10)
  if (two >= 51 && two <= 55) return 'Mastercard'
  if (d.startsWith('34') || d.startsWith('37')) return 'Amex'
  return i18n.t('payment.credit_card')
}

function parseExpiry(mmYy) {
  const m = mmYy.replace(/\D/g, '')
  if (m.length < 4) return null
  const month = parseInt(m.slice(0, 2), 10)
  const year = parseInt(m.slice(2, 4), 10)
  if (month < 1 || month > 12) return null
  return { month, year }
}

function expiryNotPast({ month, year }) {
  const now = new Date()
  const yFull = 2000 + year
  if (yFull > now.getFullYear()) return true
  if (yFull < now.getFullYear()) return false
  return month >= now.getMonth() + 1
}

async function persistPaymentMethods(dispatch, user, next) {
  const updatedUser = { ...user, paymentMethods: next }
  dispatch({ type: 'UPDATE_USER', payload: { paymentMethods: next } })
  try {
    await AsyncStorage.setItem('userData', JSON.stringify(updatedUser))
  } catch (e) {
    console.warn('AsyncStorage userData', e)
  }
}

function AddCard({ navigation }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.userReducer)
  const [holderName, setHolderName] = useState('')
  const [numberDisplay, setNumberDisplay] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [saving, setSaving] = useState(false)

  const digits = digitsOnly(numberDisplay)
  const isAmex = digits.startsWith('34') || digits.startsWith('37')
  const cvvMax = isAmex ? 4 : 3

  useEffect(() => {
    navigation.setOptions({
      title: i18n.t('wallet.addCard'),
    })
  }, [navigation])

  const onChangeNumber = useCallback(
    (text) => {
      const raw = digitsOnly(text).slice(0, 19)
      setNumberDisplay(formatCardNumberDisplay(raw))
    },
    []
  )

  const onChangeExpiry = useCallback((text) => {
    const d = digitsOnly(text).slice(0, 4)
    if (d.length <= 2) {
      setExpiry(d)
      return
    }
    setExpiry(`${d.slice(0, 2)}/${d.slice(2)}`)
  }, [])

  const onChangeCvv = useCallback(
    (text) => {
      setCvv(digitsOnly(text).slice(0, cvvMax))
    },
    [cvvMax]
  )

  const validate = () => {
    const name = holderName.trim()
    if (!name) {
      Alert.alert(i18n.t('common.error'), i18n.t('wallet.cardValidationName'))
      return null
    }
    const cardDigits = digits.slice(0, 19)
    if (cardDigits.length < 13 || cardDigits.length > 19) {
      Alert.alert(i18n.t('common.error'), i18n.t('wallet.cardValidationNumber'))
      return null
    }
    if (!validLuhn(cardDigits)) {
      Alert.alert(i18n.t('common.error'), i18n.t('wallet.cardValidationInvalidNumber'))
      return null
    }
    const exp = parseExpiry(expiry)
    if (!exp) {
      Alert.alert(i18n.t('common.error'), i18n.t('wallet.cardValidationExpiry'))
      return null
    }
    if (!expiryNotPast(exp)) {
      Alert.alert(i18n.t('common.error'), i18n.t('wallet.cardValidationExpiryPast'))
      return null
    }
    if (cvv.length < (isAmex ? 4 : 3)) {
      Alert.alert(i18n.t('common.error'), i18n.t('wallet.cardValidationCvv'))
      return null
    }
    const last4 = cardDigits.slice(-4)
    const brand = cardBrandLabel(cardDigits)
    return {
      name,
      last4,
      brand,
      expiryMonth: exp.month,
      expiryYear: 2000 + exp.year,
    }
  }

  const handleSave = async () => {
    const parsed = validate()
    if (!parsed) return
    setSaving(true)
    try {
      const label = `${parsed.brand} •••• ${parsed.last4}`
      const entry = {
        _id: `card_${Date.now()}`,
        type: 'card',
        details: {
          label,
          cardNumberLast4: parsed.last4,
          cardBrand: parsed.brand.toLowerCase(),
          cardholderName: parsed.name,
          expiryMonth: parsed.expiryMonth,
          expiryYear: parsed.expiryYear,
        },
      }
      const next = [...(user.paymentMethods || []), entry]
      await persistPaymentMethods(dispatch, user, next)
      Alert.alert(i18n.t('wallet.cardAddedTitle'), i18n.t('wallet.cardAddedMessage'), [
        { text: i18n.t('common.ok'), onPress: () => navigation.goBack() },
      ])
    } finally {
      setSaving(false)
    }
  }

  const Field = ({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry, maxLength }) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.secondary}
          keyboardType={keyboardType || 'default'}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          autoCorrect={false}
        />
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconHeader}>
            <View style={styles.iconCircle}>
              <FontAwesome name="credit-card" size={28} color={colors.primary} />
            </View>
            <Text style={styles.title}>{i18n.t('wallet.addCreditOrDebit')}</Text>
          </View>

          <Field
            label={i18n.t('wallet.cardHolderName')}
            value={holderName}
            onChangeText={setHolderName}
            placeholder={i18n.t('wallet.cardHolderNamePlaceholder')}
            maxLength={80}
          />
          <Field
            label={i18n.t('wallet.cardNumber')}
            value={numberDisplay}
            onChangeText={onChangeNumber}
            placeholder={i18n.t('wallet.cardNumberPlaceholder')}
            keyboardType="number-pad"
          />
          <View style={styles.rowTwo}>
            <View style={[styles.rowTwoItem, styles.rowTwoItemLeft]}>
              <Field
                label={i18n.t('wallet.cardExpiry')}
                value={expiry}
                onChangeText={onChangeExpiry}
                placeholder={i18n.t('wallet.cardExpiryPlaceholder')}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
            <View style={[styles.rowTwoItem, styles.rowTwoItemRight]}>
              <Field
                label={i18n.t('wallet.cardCvv')}
                value={cvv}
                onChangeText={onChangeCvv}
                placeholder={i18n.t('wallet.cardCvvPlaceholder')}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={cvvMax}
              />
            </View>
          </View>

          <View style={styles.hintRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.text.secondary} style={styles.hintIcon} />
            <Text style={styles.hint}>{i18n.t('wallet.cardSecurityHint')}</Text>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={() => void handleSave()}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={22} color={colors.text.white} style={styles.saveIcon} />
            <Text style={styles.saveText}>{i18n.t('wallet.saveCard')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default function AddCardWrapper(props) {
  const { loading, stripePublishableKey } = useGateway()

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.gatewayLoading]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    )
  }

  if (stripePublishableKey) {
    return (
      <StripeProvider publishableKey={stripePublishableKey} urlScheme="goodfoods">
        <AddCard {...props} />
      </StripeProvider>
    )
  }

  return <AddCard {...props} />
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  gatewayLoading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
  },
  iconHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  inputWrap: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  rowTwo: {
    flexDirection: 'row',
  },
  rowTwoItem: {
    flex: 1,
  },
  rowTwoItemLeft: {
    marginRight: 6,
  },
  rowTwoItemRight: {
    marginLeft: 6,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 4,
  },
  hintIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  hint: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveIcon: {
    marginRight: 8,
  },
  saveBtnDisabled: {
    opacity: 0.65,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.white,
  },
})
