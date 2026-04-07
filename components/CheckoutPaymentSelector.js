import React from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import i18n from '../lang/i18n'
import { colors } from '../global'
import PaymentMethodItem from './PaymentMethodItem'

export default function CheckoutPaymentSelector({
  visible,
  paymentMethods = [],
  activePaymentMethod = null,
  onSelect,
  onClose,
  onManage,
}) {
  const selectedId = activePaymentMethod?.id

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {i18n.t('checkout.paymentMethod', 'Payment Method')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            {i18n.t('checkout.selectPayment', 'Select payment method')}
          </Text>

          {paymentMethods.length > 0 ? (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {paymentMethods.map((method, index) => {
                return (
                  <PaymentMethodItem
                    key={method.id || String(index)}
                    method={method}
                    variant="checkout"
                    isSelected={method.id === selectedId}
                    onPress={() => {
                      onSelect?.(method)
                      onClose?.()
                    }}
                  />
                )
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={40} color={colors.text.secondary} />
              <Text style={styles.emptyStateText}>
                {i18n.t('wallet.noPaymentMethods', 'No payment methods')}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.manageButton} onPress={onManage}>
            <Text style={styles.manageButtonText}>
              {i18n.t('checkout.managePayment', 'Manage')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  manageButton: {
    marginTop: 8,
    backgroundColor: colors.background.secondary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  manageButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
})
