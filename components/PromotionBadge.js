import { View, Text, StyleSheet} from 'react-native'
import React, { useState, useEffect } from 'react'
import { MaterialCommunityIcons, FontAwesome, Ionicons } from '@expo/vector-icons'
import { colors } from '../global'
import { getRestaurantPromotions } from '../api'

const getPromotionIcon = (promotionText) => {
  const text = promotionText.toLowerCase();
  if (text.includes('$') || text.includes('€') || text.includes('off') || text.includes('discount')) {
    return { name: 'percent', type: 'MaterialCommunityIcons' };
  }
  if (text.includes('free') || text.includes('gratuit')) {
    return { name: 'gift', type: 'FontAwesome' };
  }
  if (text.includes('reward') || text.includes('points')) {
    return { name: 'star', type: 'FontAwesome' };
  }
  if (text.includes('delivery') || text.includes('livraison')) {
    return { name: 'truck-fast', type: 'MaterialCommunityIcons' };
  }
  // Default icon
  return { name: 'tag', type: 'FontAwesome' };
};

export default function PromotionBadge({restaurant}) {
  const [promotion, setPromotion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromotion = async () => {
      try {
        if (!restaurant || !restaurant.restaurantId) {
          setLoading(false);
          return;
        }

        const promotions = await getRestaurantPromotions(restaurant.restaurantId);

        // Prendre la première promotion (la plus prioritaire) ou utiliser la propriété reward statique comme fallback
        const activePromotion = promotions.length > 0 ? promotions[0] : null;
        setPromotion(activePromotion);
      } catch (error) {
        console.error('Error fetching restaurant promotion:', error);
        // Fallback à la propriété statique si l'API échoue
        setPromotion(restaurant.reward ? { name: restaurant.reward } : null);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotion();
  }, [restaurant]);

  // Si pas de promotion ou chargement en cours, ne rien afficher
  if (loading || !promotion) {
    return null;
  }

  // Déterminer le texte à afficher selon le type de promotion
  const getPromotionText = () => {
    if (typeof promotion === 'string') {
      // Ancien format (propriété statique)
      return promotion;
    }

    // Nouveau format depuis l'API
    if (promotion.promotionType === 'percentage_discount' && promotion.discountValue) {
      return `${promotion.discountValue}% OFF`;
    }
    if (promotion.promotionType === 'free_delivery') {
      return 'FREE DELIVERY';
    }
    if (promotion.promotionType === 'buy_x_get_y') {
      return 'BUY 1 GET 1';
    }
    if (promotion.promotionType === 'flash_sale') {
      return 'FLASH DEAL';
    }

    // Fallback au nom de la promotion
    return promotion.name || 'SPECIAL OFFER';
  };

  const promotionText = getPromotionText();
  const iconConfig = getPromotionIcon(promotionText);

  const IconComponent = iconConfig.type === 'MaterialCommunityIcons' ? MaterialCommunityIcons :
                       iconConfig.type === 'Ionicons' ? Ionicons : FontAwesome;

  return (
    <View style={styles.promotionContainer}>
      <View style={[styles.promotion, { backgroundColor: colors.success }]}>
        <IconComponent
          name={iconConfig.name}
          size={14}
          color="white"
          style={styles.promotionIcon}
        />
        <Text style={styles.promotionText}>{promotionText}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
    promotionContainer: {
        position: "absolute",
        top: 10,
        left: 11,
        zIndex: 10,
    },
    promotion: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.success,
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
        minHeight: 24,
        // Ombre pour iOS
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        // Ombre pour Android
        elevation: 4,
        // Effet de brillance
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    promotionIcon: {
        marginRight: 4,
    },
    promotionText: {
        color: "white",
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 0.3,
    },
})