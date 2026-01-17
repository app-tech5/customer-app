import { View, Text, StyleSheet} from 'react-native'
import React from 'react'
import { MaterialCommunityIcons, FontAwesome, Ionicons } from '@expo/vector-icons'

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
  // Default icon
  return { name: 'tag', type: 'FontAwesome' };
};

const getRewardColor = (rewardText) => {
  const text = rewardText.toLowerCase();
  if (text.includes('$') || text.includes('€') || text.includes('off')) {
    return { primary: '#FF6B35', secondary: '#F7931E' }; // Orange gradient
  }
  if (text.includes('free') || text.includes('gratuit')) {
    return { primary: '#4CAF50', secondary: '#45a049' }; // Green gradient
  }
  if (text.includes('reward') || text.includes('points')) {
    return { primary: '#9C27B0', secondary: '#7B1FA2' }; // Purple gradient
  }
  return { primary: '#2196F3', secondary: '#1976D2' }; // Blue gradient (default)
};

export default function Reward({restaurant}) {
  const iconConfig = getRewardIcon(restaurant.reward);
  const colors = getRewardColor(restaurant.reward);

  const IconComponent = iconConfig.type === 'MaterialCommunityIcons' ? MaterialCommunityIcons :
                       iconConfig.type === 'Ionicons' ? Ionicons : FontAwesome;

  return (
    <View style={styles.rewardContainer}>
      <View style={[styles.reward, { backgroundColor: colors.primary }]}>
        <IconComponent
          name={iconConfig.name}
          size={16}
          color="white"
          style={styles.rewardIcon}
        />
        <Text style={styles.rewardText}>{restaurant.reward}</Text>
      </View>
      <View style={[styles.rewardPointer, { borderLeftColor: colors.primary }]} />
    </View>
  )
}

const styles = StyleSheet.create({
    rewardContainer: {
        position: "absolute",
        top: 20,
        left: 0,
        zIndex: 10,
    },
    reward: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: "#4CAF50",
        borderTopRightRadius: 25,
        borderBottomRightRadius: 25,
        paddingVertical: 8,
        paddingHorizontal: 16,
        minHeight: 32,
        // Ombre pour iOS
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        // Ombre pour Android
        elevation: 6,
        // Effet de brillance
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    rewardIcon: {
        marginRight: 6,
    },
    rewardText: {
        color: "white",
        fontSize: 13,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    rewardPointer: {
        position: 'absolute',
        left: 0,
        top: '50%',
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 0,
        borderTopWidth: 8,
        borderBottomWidth: 8,
        borderLeftColor: '#4CAF50',
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderRightColor: 'transparent',
        marginTop: -8,
        marginLeft: -1,
    }
})