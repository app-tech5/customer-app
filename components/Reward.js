import { View, Text, StyleSheet} from 'react-native'
import React, { useState, useEffect } from 'react'
import { MaterialCommunityIcons, FontAwesome, Ionicons } from '@expo/vector-icons'
import { colors } from '../global'
import { getRestaurantPromotions } from '../api'

const getRewardIcon = (rewardText) => {
  const text = rewardText.toLowerCase();
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
  
  return { name: 'tag', type: 'FontAwesome' };
};

export default function Reward({restaurant}) {
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
        
        const activePromotion = promotions.length > 0 ? promotions[0] : null;
        setPromotion(activePromotion);
      } catch (error) {
        console.error('Error fetching restaurant promotion:', error);
        
        setPromotion(restaurant.reward ? { name: restaurant.reward } : null);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotion();
  }, [restaurant]);
  
  if (loading || !promotion) {
    return null;
  }
  
  const getPromotionText = () => {
    if (typeof promotion === 'string') {
      
      return promotion;
    }
    
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
    
    return promotion.name || 'SPECIAL OFFER';
  };

  const promotionText = getPromotionText();
  const iconConfig = getRewardIcon(promotionText);

  const IconComponent = iconConfig.type === 'MaterialCommunityIcons' ? MaterialCommunityIcons :
                       iconConfig.type === 'Ionicons' ? Ionicons : FontAwesome;

  return (
    <View style={styles.rewardContainer}>
      <View style={[styles.reward, { backgroundColor: colors.success }]}>
        <IconComponent
          name={iconConfig.name}
          size={14}
          color="white"
          style={styles.rewardIcon}
        />
        <Text style={styles.rewardText}>{promotionText}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
    rewardContainer: {
        position: "absolute",
        top: 10,
        left: 11,
        zIndex: 10,
    },
    reward: {
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
    rewardIcon: {
        marginRight: 4,
    },
    rewardText: {
        color: "white",
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 0.3,
    },
})