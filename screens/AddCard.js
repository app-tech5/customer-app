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
import React, { useEffect, useState } from 'react'
import { CardField, StripeProvider } from '@stripe/stripe-react-native'
import { Ionicons, FontAwesome } from '@expo/vector-icons'
import { useSelector, useDispatch } from 'react-redux'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n from '../lang/i18n'
import { colors } from '../global'
import { useGateway } from '../contexts/GatewayContext'

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
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    navigation.setOptions({
      title: i18n.t('wallet.addCard'),
    })
  }, [navigation])

  const handleSave = async () => {
    if (!holderName.trim()) {
      Alert.alert(i18n.t('common.error'), i18n.t('wallet.cardValidationName'))
      return
    }

    setSaving(true)

    try {
      const entry = {
        _id: `card_${Date.now()}`,
        type: 'card',
        details: {
          cardholderName: holderName.trim(),
        },
      }

      const next = [...(user.paymentMethods || []), entry]
      await persistPaymentMethods(dispatch, user, next)

      Alert.alert(
        i18n.t('wallet.cardAddedTitle'),
        i18n.t('wallet.cardAddedMessage'),
        [{ text: i18n.t('common.ok'), onPress: () => navigation.goBack() }]
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconHeader}>
            <View style={styles.iconCircle}>
              <FontAwesome name="credit-card" size={28} color={colors.primary} />
            </View>
            <Text style={styles.title}>
              {i18n.t('wallet.addCreditOrDebit')}
            </Text>
          </View>

          {/* NAME FIELD SIMPLE */}
          <View style={styles.field}>
            <Text style={styles.label}>
              {i18n.t('wallet.cardHolderName')}
            </Text>

            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={holderName}
                onChangeText={setHolderName}
                placeholder={i18n.t('wallet.cardHolderNamePlaceholder')}
                placeholderTextColor={colors.text.secondary}
                autoCorrect={false}
                blurOnSubmit={false}
              />
            </View>
          </View>

          {/* STRIPE CARD FIELD */}
          <View style={styles.field}>
            <Text style={styles.label}>
              {i18n.t('wallet.cardNumber')}
            </Text>

            <View style={styles.inputWrap}>
              <CardField
                postalCodeEnabled={false}
                style={{
                  width: '100%',
                  height: 50,
                }}
                cardStyle={{
                  backgroundColor: colors.background.primary,
                  textColor: colors.text.primary,
                }}
              />
            </View>
          </View>

          <View style={styles.hintRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={colors.text.secondary}
              style={styles.hintIcon}
            />
            <Text style={styles.hint}>
              {i18n.t('wallet.cardSecurityHint')}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={colors.text.white}
              style={styles.saveIcon}
            />
            <Text style={styles.saveText}>
              {i18n.t('wallet.saveCard')}
            </Text>
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
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    )
  }

  if (stripePublishableKey) {
    return (
      <StripeProvider
        publishableKey={stripePublishableKey}
        urlScheme="goodfoods"
      >
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
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  hintIcon: {
    marginRight: 8,
  },
  hint: {
    flex: 1,
    fontSize: 13,
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
  saveBtnDisabled: {
    opacity: 0.65,
  },
  saveIcon: {
    marginRight: 8,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.white,
  },
})