import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  listSubscriptionPlans,
  getMySubscription,
  subscribeToPlan,
  cancelMySubscription,
} from '../api';
import { useDeliverySettings } from '../contexts/DeliverySettingsContext';
import { colors } from '../global';
import i18n from '../lang/i18n';

export default function SubscriptionsScreen() {
  const navigation = useNavigation();
  const { refreshSubscriptionBenefits } = useDeliverySettings();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [plans, setPlans] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [benefits, setBenefits] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [plansRes, mineRes] = await Promise.all([
        listSubscriptionPlans('customer'),
        getMySubscription(),
      ]);
      setPlans(plansRes?.plans || []);
      setEnrollment(mineRes?.enrollment || null);
      setBenefits(mineRes?.benefits || null);
    } catch (error) {
      Alert.alert(i18n.t('common.error'), error?.message || i18n.t('subscription.loadError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  React.useEffect(() => {
    navigation.setOptions({
      title: i18n.t('subscription.title'),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 10, marginLeft: 5 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text?.primary || '#111'} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const onSubscribe = (plan) => {
    Alert.alert(
      i18n.t('subscription.confirmTitle'),
      i18n.t('subscription.confirmMessage', {
        name: plan.name,
        price: plan.price,
        cycle: plan.billingCycle,
      }),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('subscription.subscribe'),
          onPress: async () => {
            try {
              setBusy(true);
              const res = await subscribeToPlan(plan.id);
              setEnrollment(res?.enrollment || null);
              setBenefits(res?.benefits || null);
              refreshSubscriptionBenefits?.();
              Alert.alert(i18n.t('common.success'), i18n.t('subscription.subscribeSuccess'));
            } catch (error) {
              Alert.alert(i18n.t('common.error'), error?.message || i18n.t('subscription.subscribeError'));
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const onCancel = () => {
    Alert.alert(i18n.t('subscription.cancelTitle'), i18n.t('subscription.cancelMessage'), [
      { text: i18n.t('common.cancel'), style: 'cancel' },
      {
        text: i18n.t('subscription.cancelAction'),
        style: 'destructive',
        onPress: async () => {
          try {
            setBusy(true);
            const res = await cancelMySubscription();
            setEnrollment(res?.enrollment?.status === 'active' ? res.enrollment : null);
            setBenefits(res?.benefits || null);
            refreshSubscriptionBenefits?.();
            Alert.alert(i18n.t('common.success'), i18n.t('subscription.cancelSuccess'));
            load();
          } catch (error) {
            Alert.alert(i18n.t('common.error'), error?.message || i18n.t('subscription.cancelError'));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const active = benefits?.active && enrollment?.status === 'active';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      {active ? (
        <View style={styles.activeCard}>
          <View style={styles.activeHeader}>
            <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
            <Text style={styles.activeTitle}>{i18n.t('subscription.activePlan')}</Text>
          </View>
          <Text style={styles.planName}>{enrollment?.plan?.name || benefits?.planName}</Text>
          <Text style={styles.meta}>
            {i18n.t('subscription.validUntil', {
              date: enrollment?.currentPeriodEnd
                ? new Date(enrollment.currentPeriodEnd).toLocaleDateString()
                : '—',
            })}
          </Text>
          {(enrollment?.plan?.benefits || benefits?.benefits || []).map((b) => (
            <View key={b} style={styles.benefitRow}>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={busy}>
            <Text style={styles.cancelText}>{i18n.t('subscription.cancelAction')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.intro}>
          <Text style={styles.introTitle}>{i18n.t('subscription.introTitle')}</Text>
          <Text style={styles.introSub}>{i18n.t('subscription.introSub')}</Text>
        </View>
      )}

      {!active &&
        plans.map((plan) => (
          <View key={plan.id} style={styles.planCard}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.price}>
              {plan.price <= 0
                ? i18n.t('subscription.free')
                : `${plan.price.toFixed(2)} ${plan.currency || ''}/${plan.billingCycle}`}
            </Text>
            {(plan.benefits || []).map((b) => (
              <View key={b} style={styles.benefitRow}>
                <Ionicons name="checkmark" size={16} color={colors.primary} />
                <Text style={styles.benefitText}>{b}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.subscribeBtn}
              onPress={() => onSubscribe(plan)}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.subscribeText}>{i18n.t('subscription.subscribe')}</Text>
              )}
            </TouchableOpacity>
          </View>
        ))}

      {!active && plans.length === 0 ? (
        <Text style={styles.empty}>{i18n.t('subscription.noPlans')}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background?.secondary || '#f5f5f7' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  intro: { marginBottom: 16 },
  introTitle: { fontSize: 22, fontWeight: '800', color: colors.text?.primary || '#111' },
  introSub: { marginTop: 8, fontSize: 15, color: colors.text?.secondary || '#666', lineHeight: 22 },
  activeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(226,59,38,0.25)',
  },
  activeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  activeTitle: { fontSize: 14, fontWeight: '800', color: colors.primary, textTransform: 'uppercase' },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  planName: { fontSize: 20, fontWeight: '800', color: colors.text?.primary || '#111' },
  price: { marginTop: 6, marginBottom: 12, fontSize: 16, fontWeight: '700', color: colors.primary },
  meta: { marginBottom: 12, color: colors.text?.secondary || '#666' },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  benefitText: { flex: 1, fontSize: 14, color: colors.text?.primary || '#222' },
  subscribeBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  subscribeText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cancelBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: { color: colors.primary, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#888', marginTop: 24 },
});
