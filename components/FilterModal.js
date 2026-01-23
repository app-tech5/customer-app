import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, Platform} from 'react-native'
import React, {useState} from 'react'
import { AntDesign, Ionicons, FontAwesome, MaterialIcons, Entypo, MaterialCommunityIcons} from '@expo/vector-icons'
import { colors, currency } from '../global'

export default function FilterModal({visible, setVisible, onApplyFilters}) {
  const [selectedFilters, setSelectedFilters] = useState({
    sort: null,
    maxDeliveryFee: 15,
    priceRange: [],
    cuisine: [],
    features: []
  })

  const handleFilterSelect = (category, filter) => {
    setSelectedFilters(prev => ({
      ...prev,
      [category]: prev[category] === filter ? null : filter
    }))
  }

  const handlePriceRangeToggle = (range) => {
    setSelectedFilters(prev => ({
      ...prev,
      priceRange: prev.priceRange.includes(range)
        ? prev.priceRange.filter(r => r !== range)
        : [...prev.priceRange, range]
    }))
  }

  const handleCuisineToggle = (cuisine) => {
    setSelectedFilters(prev => ({
      ...prev,
      cuisine: prev.cuisine.includes(cuisine)
        ? prev.cuisine.filter(c => c !== cuisine)
        : [...prev.cuisine, cuisine]
    }))
  }

  const handleFeatureToggle = (feature) => {
    setSelectedFilters(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }))
  }

  const handleApplyFilters = () => {
    if (onApplyFilters) {
      onApplyFilters(selectedFilters)
    }
    setVisible(false)
  }

  const handleResetFilters = () => {
    const resetFilters = {
      sort: null,
      maxDeliveryFee: 15,
      priceRange: [],
      cuisine: [],
      features: []
    }
    setSelectedFilters(resetFilters)
    if (onApplyFilters) {
      onApplyFilters(resetFilters)  // Appliquer les filtres remis à zéro
    }
    setVisible(false)  // Fermer le modal après reset
  }

  return (
      <Modal animationType='slide' visible={visible}>
          <View style={styles.container}>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeButton}>
                  <AntDesign name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.textHeader}>Filtres</Text>
                <TouchableOpacity onPress={handleResetFilters}>
                  <Text style={styles.resetText}>Réinitialiser</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
                {/* Tri */}
                <SectionTitle text="Trier par" />
                <View style={styles.filterGroup}>
                  <FilterOption
                    icon="star"
                    text="Recommandé pour vous"
                    iconType="MaterialCommunityIcons"
                    selected={selectedFilters.sort === 'picked'}
                    onPress={() => handleFilterSelect('sort', 'picked')}
                  />
                  <FilterOption
                    icon="trending-up"
                    text="Les plus populaires"
                    iconType="MaterialIcons"
                    selected={selectedFilters.sort === 'popular'}
                    onPress={() => handleFilterSelect('sort', 'popular')}
                  />
                  <FilterOption
                    icon="star"
                    text="Mieux notés"
                    iconType="AntDesign"
                    selected={selectedFilters.sort === 'rating'}
                    onPress={() => handleFilterSelect('sort', 'rating')}
                  />
                  <FilterOption
                    icon="clock-time-three"
                    text="Livraison rapide"
                    iconType="MaterialCommunityIcons"
                    selected={selectedFilters.sort === 'delivery'}
                    onPress={() => handleFilterSelect('sort', 'delivery')}
                  />
                  <FilterOption
                    icon="tag"
                    text="Meilleurs offres"
                    iconType="AntDesign"
                    selected={selectedFilters.sort === 'deals'}
                    onPress={() => handleFilterSelect('sort', 'deals')}
                  />
                </View>

                {/* Frais de livraison maximum */}
                <SectionTitle text="Frais de livraison maximum" />
                <View style={styles.deliveryFeeContainer}>
                  <View style={styles.deliveryFeeOptions}>
                    {[5, 10, 15, 20].map((fee) => (
                      <TouchableOpacity
                        key={fee}
                        style={[
                          styles.deliveryFeeOption,
                          selectedFilters.maxDeliveryFee === fee && styles.deliveryFeeOptionSelected
                        ]}
                        onPress={() => setSelectedFilters(prev => ({...prev, maxDeliveryFee: fee}))}
                      >
                        <Text style={[
                          styles.deliveryFeeText,
                          selectedFilters.maxDeliveryFee === fee && styles.deliveryFeeTextSelected
                        ]}>
                          {fee === 20 ? `${fee}+ ${currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '$'}` : `${fee} ${currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '$'}`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Gamme de prix */}
                <SectionTitle text="Gamme de prix" />
                <View style={styles.priceRangeContainer}>
                  {[
                    {label: '$', value: 'budget'},
                    {label: '$$', value: 'moderate'},
                    {label: '$$$', value: 'expensive'},
                    {label: '$$$$', value: 'luxury'}
                  ].map((range) => (
                    <TouchableOpacity
                      key={range.value}
                      style={[
                        styles.priceRangeOption,
                        selectedFilters.priceRange.includes(range.value) && styles.priceRangeOptionSelected
                      ]}
                      onPress={() => handlePriceRangeToggle(range.value)}
                    >
                      <Text style={[
                        styles.priceRangeText,
                        selectedFilters.priceRange.includes(range.value) && styles.priceRangeTextSelected
                      ]}>
                        {range.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Type de cuisine */}
                <SectionTitle text="Type de cuisine" />
                <View style={styles.filterGroup}>
                  {[
                    {icon: 'pizza', text: 'Italienne', search: 'italian', type: 'MaterialCommunityIcons'},
                    {icon: 'hamburger', text: 'Américaine', search: 'american', type: 'FontAwesome'},
                    {icon: 'noodles', text: 'Asiatique', search: 'asian', type: 'MaterialCommunityIcons'},
                    {icon: 'food-variant', text: 'Française', search: 'french', type: 'MaterialCommunityIcons'},
                    {icon: 'leaf', text: 'Végétarienne', search: 'vegetarian', type: 'FontAwesome'},
                    {icon: 'glass-wine', text: 'Bar & Vin', search: 'bar', type: 'MaterialCommunityIcons'}
                  ].map((cuisine) => (
                    <FilterOption
                      key={cuisine.text}
                      icon={cuisine.icon}
                      text={cuisine.text}
                      iconType={cuisine.type}
                      selected={selectedFilters.cuisine.includes(cuisine.search)}
                      onPress={() => handleCuisineToggle(cuisine.search)}
                    />
                  ))}
                </View>

                {/* Fonctionnalités */}
                <SectionTitle text="Fonctionnalités" />
                <View style={styles.filterGroup}>
                  <FilterOption
                    icon="local-shipping"
                    text="Livraison gratuite"
                    iconType="MaterialIcons"
                    selected={selectedFilters.features.includes('free_delivery')}
                    onPress={() => handleFeatureToggle('free_delivery')}
                  />
                  <FilterOption
                    icon="schedule"
                    text="Ouvert maintenant"
                    iconType="MaterialIcons"
                    selected={selectedFilters.features.includes('open_now')}
                    onPress={() => handleFeatureToggle('open_now')}
                  />
                  <FilterOption
                    icon="local-offer"
                    text="Offres spéciales"
                    iconType="MaterialIcons"
                    selected={selectedFilters.features.includes('special_offers')}
                    onPress={() => handleFeatureToggle('special_offers')}
                  />
                  <FilterOption
                    icon="star"
                    text="Nouveau restaurant"
                    iconType="MaterialIcons"
                    selected={selectedFilters.features.includes('new_restaurant')}
                    onPress={() => handleFeatureToggle('new_restaurant')}
                  />
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
                  <Text style={styles.applyButtonText}>Appliquer les filtres</Text>
                </TouchableOpacity>
              </View>
          </View>
    </Modal>
  )
}

const SectionTitle = ({text}) => {
    return (
        <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>{text}</Text>
        </View>
    )
}

const FilterOption = ({icon, text, iconType, selected, onPress}) => {
    const renderIcon = () => {
        const iconProps = { name: icon, size: 20, color: selected ? colors.primary : colors.text.secondary }

        switch (iconType) {
            case 'AntDesign':
                return <AntDesign {...iconProps} />
            case 'Ionicons':
                return <Ionicons {...iconProps} />
            case 'FontAwesome':
                return <FontAwesome {...iconProps} />
            case 'MaterialIcons':
                return <MaterialIcons {...iconProps} />
            case 'MaterialCommunityIcons':
                return <MaterialCommunityIcons {...iconProps} />
            case 'Entypo':
                return <Entypo {...iconProps} />
            default:
                return null
        }
    }

    return (
        <TouchableOpacity
            style={[styles.filterOption, selected && styles.filterOptionSelected]}
            onPress={onPress}
        >
            <View style={styles.filterOptionContent}>
                {renderIcon()}
                <Text style={[styles.filterOptionText, selected && styles.filterOptionTextSelected]}>
                    {text}
                </Text>
            </View>
            {selected && (
                <AntDesign name="check" size={16} color={colors.primary} />
            )}
        </TouchableOpacity>
    )
}

 

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
        backgroundColor: colors.background.primary,
    },
    closeButton: {
        padding: 5,
    },
    textHeader: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text.primary,
        letterSpacing: -0.5,
    },
    resetText: {
        fontSize: 16,
        color: colors.primary,
        fontWeight: '600',
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    sectionTitleContainer: {
        marginTop: 25,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
        letterSpacing: -0.3,
    },
    filterGroup: {
        marginBottom: 10,
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 8,
        borderRadius: 12,
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.border.light,
    },
    filterOptionSelected: {
        backgroundColor: colors.highlight,
        borderColor: colors.primary,
    },
    filterOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterOptionText: {
        fontSize: 16,
        color: colors.text.secondary,
        marginLeft: 12,
        fontWeight: '500',
    },
    filterOptionTextSelected: {
        color: colors.primary,
        fontWeight: '600',
    },
    deliveryFeeContainer: {
        marginBottom: 25,
    },
    deliveryFeeOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    deliveryFeeOption: {
        flex: 1,
        marginHorizontal: 4,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border.medium,
        alignItems: 'center',
        backgroundColor: colors.background.primary,
    },
    deliveryFeeOptionSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    deliveryFeeText: {
        fontSize: 14,
        color: colors.text.secondary,
        fontWeight: '600',
    },
    deliveryFeeTextSelected: {
        color: colors.text.white,
    },
    priceRangeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    priceRangeOption: {
        flex: 1,
        marginHorizontal: 4,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border.medium,
        alignItems: 'center',
        backgroundColor: colors.background.primary,
    },
    priceRangeOptionSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    priceRangeText: {
        fontSize: 16,
        color: colors.text.secondary,
        fontWeight: '600',
    },
    priceRangeTextSelected: {
        color: colors.text.white,
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
        backgroundColor: colors.background.primary,
    },
    applyButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: colors.shadow,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    applyButtonText: {
        color: colors.text.white,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
}) 

