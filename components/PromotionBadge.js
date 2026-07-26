import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react'
import { MaterialCommunityIcons, FontAwesome, Ionicons } from '@expo/vector-icons'
import { colors } from '../global'
import { filterRestaurantPromotions, getRestaurantPromotions } from '../api'
import { getRestaurantId } from '../utils/restaurantId'

const BADGE_PROMOTION_OPTIONS = { includePlatform: false };

const getPromotionIcon = (promotionText) => {
  const text = promotionText.toLowerCase();
  if (text.includes('free') || text.includes('gratuit') || text.includes('delivery') || text.includes('livraison')) {
    return { name: 'truck-fast', type: 'MaterialCommunityIcons' };
  }
  if (text.includes('$') || text.includes('€') || text.includes('off') || text.includes('discount') || text.includes('%')) {
    return { name: 'percent', type: 'MaterialCommunityIcons' };
  }
  if (text.includes('reward') || text.includes('points')) {
    return { name: 'star', type: 'FontAwesome' };
  }

  return { name: 'tag', type: 'FontAwesome' };
};

export default function PromotionBadge({restaurant, allPromotions, allMenus}) {
  const [promotion, setPromotion] = useState(null);
  const [loading, setLoading] = useState(!(allPromotions && Array.isArray(allPromotions)));

  useEffect(() => {
    const restaurantId = getRestaurantId(restaurant);

    if (allPromotions && Array.isArray(allPromotions)) {
      if (!restaurantId) {
        setPromotion(null);
        setLoading(false);
        return;
      }

      const restaurantPromotions = filterRestaurantPromotions(
        allPromotions,
        restaurantId,
        allMenus,
        BADGE_PROMOTION_OPTIONS
      );
      const activePromotion = restaurantPromotions.length > 0 ? restaurantPromotions[0] : null;
      setPromotion(activePromotion || null);
      setLoading(false);
      return;
    }

    const fetchPromotion = async () => {
      try {
        if (!restaurantId) {
          setPromotion(null);
          return;
        }

        const promotions = await getRestaurantPromotions(restaurantId, BADGE_PROMOTION_OPTIONS);
        const activePromotion = promotions.length > 0 ? promotions[0] : null;
        setPromotion(activePromotion);
      } catch (error) {
        console.error('Error fetching restaurant promotion:', error);
        setPromotion(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotion();
  }, [restaurant, allPromotions, allMenus]);

  if (loading) {
    return (
      <View style={styles.promotionContainer}>
        <ActivityIndicator size="small" color={colors.success} />
      </View>
    );
  }

  if (!promotion) {
    return null;
  }
  
  const getPromotionText = () => {
    if (typeof promotion === 'string') {
      
      return promotion;
    }
    
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
        
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        
        elevation: 4,
        
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
