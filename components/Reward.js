import { View, Text, StyleSheet} from 'react-native'
import React from 'react'
import { MaterialCommunityIcons, FontAwesome, Ionicons } from '@expo/vector-icons'
import { colors } from '../global'

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

export default function Reward({restaurant}) {
  const iconConfig = getRewardIcon(restaurant.reward);

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
        <Text style={styles.rewardText}>{restaurant.reward}</Text>
      </View>
      <View style={[styles.rewardPointer, { borderLeftColor: colors.success }]} />
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
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
        minHeight: 28,
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
    rewardIcon: {
        marginRight: 4,
    },
    rewardText: {
        color: "white",
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 0.3,
    },
    rewardPointer: {
        position: 'absolute',
        left: 0,
        top: '50%',
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 0,
        borderTopWidth: 6,
        borderBottomWidth: 6,
        borderLeftColor: '#4CAF50',
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderRightColor: 'transparent',
        marginTop: -6,
        marginLeft: -1,
    }
})