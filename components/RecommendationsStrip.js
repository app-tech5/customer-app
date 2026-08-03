import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, currency, language } from '../global';
import i18n from '../lang/i18n';
import { getIntelligenceRecommendations } from '../api';

const DEFAULT_FOOD_IMAGE = require('../assets/images/default-food.jpg');

function RecommendationImage({ uri }) {
  const [failed, setFailed] = useState(false);
  const hasUri = Boolean(uri && String(uri).trim());

  return (
    <Image
      source={hasUri && !failed ? { uri: String(uri).trim() } : DEFAULT_FOOD_IMAGE}
      style={styles.image}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

export default function RecommendationsStrip({
  restaurant,
  productIds = [],
  lat,
  lng,
  onSelect,
}) {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(false);

  const restaurantId = restaurant?._id || restaurant?.id;

  const load = useCallback(async () => {
    if (!restaurantId) return;
    try {
      setLoading(true);
      const data = await getIntelligenceRecommendations({
        restaurantId,
        productIds,
        lat,
        lng,
        limit: 6,
      });
      setItems(Array.isArray(data?.items) ? data.items : []);
      setContext(data?.context || null);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, JSON.stringify(productIds), lat, lng]);

  useEffect(() => {
    load();
  }, [load]);

  if (!restaurantId) return null;
  if (!loading && items.length === 0) return null;

  const formatPrice = (price) =>
    Number(price || 0).toLocaleString(language, {
      style: 'currency',
      currency,
    });

  return (
    <View style={styles.wrap} testID="ai-recommendations">
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles" size={16} color={colors.primary} />
          <Text style={styles.title}>
            {i18n.t('intelligence.recommendationsTitle')}
          </Text>
        </View>
        {context?.weather?.condition ? (
          <Text style={styles.subtitle}>
            {i18n.t('intelligence.recommendationsSubtitle')}
          </Text>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {items.map((item) => (
            <TouchableOpacity
              key={String(item._id)}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => {
                if (onSelect) onSelect(item);
                else {
                  navigation.navigate('MenuDetailScreen', {
                    food: item,
                    restaurant,
                  });
                }
              }}
            >
              <RecommendationImage uri={item.image} />
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.reason} numberOfLines={1}>
                {item.reason || i18n.t('intelligence.recommended')}
              </Text>
              <Text style={styles.price}>{formatPrice(item.price)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  header: {
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text?.primary || '#111',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.text?.secondary || '#666',
  },
  row: {
    paddingRight: 8,
    gap: 10,
  },
  card: {
    width: 132,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  image: {
    width: '100%',
    height: 84,
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
  },
  name: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
    minHeight: 34,
  },
  reason: {
    marginTop: 2,
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  price: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '800',
    color: '#111',
  },
});
