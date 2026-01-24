import { useState } from "react";
import { View, Text, Image, Pressable, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';
import { language, currency, colors } from '../global';
import i18n from '../i18n';

const OrderListItem = ({ order }) => {
  const navigation = useNavigation();

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'preparing': return colors.info;
      case 'out_for_delivery': return colors.primary;
      case 'delivered': return colors.success;
      case 'cancelled': return colors.error;
      default: return colors.grey[500];
    }
  };

  // Fonction pour obtenir le texte du statut
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return i18n.t('orders.status.pending');
      case 'preparing': return i18n.t('orders.status.preparing');
      case 'out_for_delivery': return i18n.t('orders.status.out_for_delivery');
      case 'delivered': return i18n.t('orders.status.delivered');
      case 'cancelled': return i18n.t('orders.status.cancelled');
      default: return status;
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return i18n.t('orders.time.today');
    if (diffDays === 2) return i18n.t('orders.time.yesterday');
    if (diffDays <= 7) return `${diffDays} ${i18n.t('orders.time.days_ago')}`;

    return date.toLocaleDateString(language.replace('_', '-'));
  };

  // Calculer le nombre total d'articles
  const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Formater le prix
  const formatPrice = (price) => {
    return Number(price).toLocaleString(language, {
      style: "currency",
      currency: currency
    });
  };

  const handlePress = () => {
    navigation.navigate('OrderDetails', { id: order._id });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Image du restaurant */}
        <Image
          source={{ uri: order.restaurant?.image || 'https://via.placeholder.com/80' }}
          style={styles.restaurantImage}
          defaultSource={require('../assets/images/default-food.jpg')}
        />

        <View style={styles.orderInfo}>
          {/* Nom du restaurant */}
          <Text style={styles.restaurantName} numberOfLines={1}>
            {order.restaurant?.name || i18n.t('orders.unknown_restaurant')}
          </Text>

          {/* Détails de la commande */}
          <View style={styles.orderDetails}>
            <Text style={styles.itemsCount}>
              {totalItems} {totalItems > 1 ? i18n.t('orders.items') : i18n.t('orders.item')}
            </Text>
            <Text style={styles.bullet}> • </Text>
            <Text style={styles.totalPrice}>
              {formatPrice(order.totalPrice)}
            </Text>
          </View>

          {/* Date et statut */}
          <View style={styles.orderMeta}>
            <Text style={styles.orderDate}>
              {formatDate(order.createdAt)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusText}>
                {getStatusText(order.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Icône de navigation */}
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.grey[400]}
          style={styles.arrowIcon}
        />
      </View>
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  restaurantImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: Platform.OS === "android" ? "bold" : "600",
    color: colors.text.primary,
    marginBottom: 4,
  },
  orderDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemsCount: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  bullet: {
    fontSize: 14,
    color: colors.text.secondary,
    marginHorizontal: 4,
  },
  totalPrice: {
    fontSize: 14,
    fontWeight: Platform.OS === "android" ? "bold" : "600",
    color: colors.primary,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderDate: {
    fontSize: 12,
    color: colors.text.muted,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: Platform.OS === "android" ? "bold" : "600",
    color: colors.white,
    textTransform: 'uppercase',
  },
  arrowIcon: {
    marginLeft: 8,
  },
});
export default OrderListItem;