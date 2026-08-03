import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../global';
import i18n from '../lang/i18n';
import { getIntelligenceQuote } from '../api';

/**
 * Shows smart ETA + surge badge for a restaurant / user location.
 */
export default function IntelligenceBadges({
  restaurantId,
  lat,
  lng,
  subtotal = 0,
  productIds = [],
  onQuote,
  compact = false,
}) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    try {
      setLoading(true);
      const data = await getIntelligenceQuote({
        restaurantId,
        lat,
        lng,
        subtotal,
        productIds,
      });
      setQuote(data);
      if (onQuote) onQuote(data);
    } catch {
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, lat, lng, subtotal, JSON.stringify(productIds)]);

  useEffect(() => {
    load();
  }, [load]);

  if (!restaurantId) return null;
  if (loading && !quote) {
    return (
      <View style={[styles.wrap, compact && styles.compact]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }
  if (!quote) return null;

  return (
    <View style={[styles.wrap, compact && styles.compact]} testID="intelligence-badges">
      <View style={styles.chip}>
        <Ionicons name="time-outline" size={14} color={colors.primary} />
        <Text style={styles.chipText}>
          {i18n.t('intelligence.etaLabel')}{' '}
          {quote.eta?.label || i18n.t('intelligence.etaUnavailable')}
        </Text>
      </View>
      {quote.surge?.active ? (
        <View style={[styles.chip, styles.surge]}>
          <Ionicons name="flash" size={14} color="#fff" />
          <Text style={[styles.chipText, styles.surgeText]}>
            {i18n.t('intelligence.surgeActive')} {quote.surge.multiplier}x
          </Text>
        </View>
      ) : (
        <View style={styles.chipMuted}>
          <Ionicons name="bicycle-outline" size={14} color="#666" />
          <Text style={styles.chipMutedText}>
            {i18n.t('intelligence.standardFee')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
    paddingHorizontal: 12,
  },
  compact: {
    paddingHorizontal: 0,
    marginVertical: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff5f3',
    borderColor: '#ffd5cc',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  surge: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  surgeText: {
    color: '#fff',
  },
  chipMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipMutedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
});
