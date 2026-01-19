import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react'
import { MaterialCommunityIcons, FontAwesome, Ionicons } from '@expo/vector-icons'
import { colors } from '../global'
import { filterRestaurantPromotions, getRestaurantPromotions } from '../api'

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

export default function PromotionBadge({restaurant, allPromotions, allMenus}) {
  const [promotion, setPromotion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si allPromotions est disponible, utiliser la fonction utilitaire de filtrage
    if (allPromotions && Array.isArray(allPromotions)) {
      const restaurantId = restaurant.restaurantId || restaurant.id;

      // Utiliser la fonction utilitaire qui applique la même logique que getRestaurantPromotions
      const restaurantPromotions = filterRestaurantPromotions(allPromotions, restaurantId, allMenus);

      // Prendre la première promotion (la plus prioritaire)
      const activePromotion = restaurantPromotions.length > 0 ? restaurantPromotions[0] : null;
      setPromotion(activePromotion || null);
      setLoading(false);
    } else {
      // Fallback : appel API individuel si allPromotions n'est pas disponible
      const fetchPromotion = async () => {
        try {
          if (!restaurant || !restaurant.restaurantId) {
            setLoading(false);
            return;
          }

          const promotions = await getRestaurantPromotions(restaurant.restaurantId);

          // Prendre la première promotion (la plus prioritaire)
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
    }
  }, [restaurant, allPromotions, allMenus]);

  // Si pas de promotion ou chargement en cours, ne rien afficher
  // if (loading || !promotion) {
  //   return null;
  // }

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

  // Déterminer le texte à afficher selon le type de promotion
  const getPromotionText = () => {
    if (typeof promotion === 'string') {
      // Ancien format (propriété statique)
      return promotion;
    }

    // Utiliser directement le nom de la promotion depuis la base de données
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
