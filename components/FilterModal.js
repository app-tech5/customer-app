import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import React, {useState} from 'react'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { AntDesign, Ionicons, FontAwesome, MaterialIcons, Entypo, MaterialCommunityIcons} from '@expo/vector-icons'
import { colors, currency } from '../global'
import i18n from '../lang/i18n'

function FilterModalContent({setVisible, onApplyFilters}) {
  const insets = useSafeAreaInsets()
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
      onApplyFilters(resetFilters)  
    }
    setVisible(false)  
  }

  return (
          <View style={styles.container}>
              <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeButton}>
                  <AntDesign name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.textHeader}>{i18n.t('filters.title')}</Text>
                <TouchableOpacity onPress={handleResetFilters}>
                  <Text style={styles.resetText}>{i18n.t('filters.reset')}</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
                <SectionTitle text={i18n.t('filters.sortBy')} />
                <View style={styles.filterGroup}>
                  <FilterOption
                    icon="star"
                    text={i18n.t('filters.sort.recommended')}
                    iconType="MaterialCommunityIcons"
                    selected={selectedFilters.sort === 'picked'}
                    onPress={() => handleFilterSelect('sort', 'picked')}
                  />
                  <FilterOption
                    icon="trending-up"
                    text={i18n.t('filters.sort.mostPopular')}
                    iconType="MaterialIcons"
                    selected={selectedFilters.sort === 'popular'}
                    onPress={() => handleFilterSelect('sort', 'popular')}
                  />
                  <FilterOption
                    icon="star"
                    text={i18n.t('filters.sort.bestRated')}
                    iconType="AntDesign"
                    selected={selectedFilters.sort === 'rating'}
                    onPress={() => handleFilterSelect('sort', 'rating')}
                  />
                  <FilterOption
                    icon="clock-time-three"
                    text={i18n.t('filters.sort.fastDelivery')}
                    iconType="MaterialCommunityIcons"
                    selected={selectedFilters.sort === 'delivery'}
                    onPress={() => handleFilterSelect('sort', 'delivery')}
                  />
                  <FilterOption
                    icon="tag"
                    text={i18n.t('filters.sort.bestDeals')}
                    iconType="AntDesign"
                    selected={selectedFilters.sort === 'deals'}
                    onPress={() => handleFilterSelect('sort', 'deals')}
                  />
                </View>

                <SectionTitle text={i18n.t('filters.maxDeliveryFee')} />
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

                <SectionTitle text={i18n.t('filters.priceRange')} />
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

                <SectionTitle text={i18n.t('filters.cuisineType')} />
                <View style={styles.filterGroup}>
                  {[
                    {icon: 'pizza', text: i18n.t('filters.cuisine.italian'), search: 'italian', type: 'MaterialCommunityIcons'},
                    {icon: 'cutlery', text: i18n.t('filters.cuisine.american'), search: 'american', type: 'FontAwesome'},
                    {icon: 'noodles', text: i18n.t('filters.cuisine.asian'), search: 'asian', type: 'MaterialCommunityIcons'},
                    {icon: 'food-variant', text: i18n.t('filters.cuisine.french'), search: 'french', type: 'MaterialCommunityIcons'},
                    {icon: 'leaf', text: i18n.t('filters.cuisine.vegetarian'), search: 'vegetarian', type: 'FontAwesome'},
                    {icon: 'glass-wine', text: i18n.t('filters.cuisine.bar'), search: 'bar', type: 'MaterialCommunityIcons'}
                  ].map((cuisine) => (
                    <FilterOption
                      key={cuisine.text}
                      icon={cuisine.icon}
                      text={i18n.t(`filters.cuisine.${cuisine.search}`)}
                      iconType={cuisine.type}
                      selected={selectedFilters.cuisine.includes(cuisine.search)}
                      onPress={() => handleCuisineToggle(cuisine.search)}
                    />
                  ))}
                </View>

                <SectionTitle text={i18n.t('filters.features')} />
                <View style={styles.filterGroup}>
                  <FilterOption
                    icon="local-shipping"
                    text={i18n.t('filters.featuresList.freeDelivery')}
                    iconType="MaterialIcons"
                    selected={selectedFilters.features.includes('free_delivery')}
                    onPress={() => handleFeatureToggle('free_delivery')}
                  />
                  <FilterOption
                    icon="schedule"
                    text={i18n.t('filters.featuresList.openNow')}
                    iconType="MaterialIcons"
                    selected={selectedFilters.features.includes('open_now')}
                    onPress={() => handleFeatureToggle('open_now')}
                  />
                  <FilterOption
                    icon="local-offer"
                    text={i18n.t('filters.featuresList.specialOffers')}
                    iconType="MaterialIcons"
                    selected={selectedFilters.features.includes('special_offers')}
                    onPress={() => handleFeatureToggle('special_offers')}
                  />
                  <FilterOption
                    icon="star"
                    text={i18n.t('filters.featuresList.newRestaurant')}
                    iconType="MaterialIcons"
                    selected={selectedFilters.features.includes('new_restaurant')}
                    onPress={() => handleFeatureToggle('new_restaurant')}
                  />
                </View>
              </ScrollView>

              <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
                  <Text style={styles.applyButtonText}>{i18n.t('filters.apply')}</Text>
                </TouchableOpacity>
              </View>
          </View>
  )
}

export default function FilterModal({visible, setVisible, onApplyFilters}) {
  return (
    <Modal animationType='slide' visible={visible}>
      <SafeAreaProvider>
        <FilterModalContent setVisible={setVisible} onApplyFilters={onApplyFilters} />
      </SafeAreaProvider>
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
        paddingTop: 20,
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

