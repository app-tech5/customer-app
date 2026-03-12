import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react'
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native'
import { Divider } from 'react-native-elements'
import { useDispatch, useSelector } from 'react-redux';
import { language, currency } from '../../global'
import { AntDesign } from '@expo/vector-icons';
import { Icon } from 'react-native-elements';
import { getFoods, getCategoriesFromRestaurant } from '../../api';
import { colors } from '../../global';
import AddToCartButton from '../AddToCartButton';
import { FlatList } from 'react-native-gesture-handler';
import { CategoriesContext } from '../../contexts/CategoriesContext';
import { loadFoodsWithSmartCache } from '../../utils/cacheUtils';
import i18n from '../../i18n';

const styles = StyleSheet.create({
  menuItemStyle: { flex: 1, },
  titleStyle: {
    fontSize: 19,
    fontFamily: "Roboto_500Medium"
  },
  groupTitle: {
    fontSize: 25,
    marginLeft: 20,
    fontWeight: "bold",
    marginVertical: 10
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  filtersContainer: {
    maxHeight: 50,
    marginBottom: 10,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.medium,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.white,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
  },
})
export default function MenuItems({ route, restaurant, activeTab, marginLeft, navigation, foodsRef,
  pickup: _pickup, delivery: _delivery, setActiveTab: _setActiveTab, userLocation: _userLocation, mapRef: _mapRef, apikey: _apikey, scrollEnabled, setScrollEnabled,
  opacity, setCategoriesFood, hideHeader: _hideHeader }) {
  
  const restaurantData = restaurant || route?.params?.restaurant
  const { categories, setCategories } = useContext(CategoriesContext)
  const [foods, setFoods] = useState([])
  const [loader, setLoader] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState([])
  
  const processFoodsData = (rawFoods) => {
    if (!rawFoods || !Array.isArray(rawFoods) || rawFoods.length === 0) {
      return [];
    }
    
    const foodsWithValidImages = rawFoods.filter(food => {
      const hasValidImage = food &&
        food.image &&
        typeof food.image === 'string' &&
        food.image.trim() !== '' &&
        food.image !== 'null' &&
        food.image !== 'undefined';
      
      if (!hasValidImage) {
      }

      return hasValidImage;
    });

    if (foodsWithValidImages.length === 0) {
      return [];
    }

    const processedFoods = foodsWithValidImages.map(food => ({
      ...food,
      id: food.id || food._id,
      price: Number(food.price)
    }));

    return processedFoods;
  };

  useEffect(() => {
    if (!restaurantData) {
      return;
    }

    const restaurantId = restaurantData.restaurantId || restaurantData.id;
    
    getCategoriesFromRestaurant(restaurantId).then((restaurantCategories) => {
      setCategories(restaurantCategories)
    }).catch(error => {
      console.error('Error fetching categories:', error);
    });

    loadFoodsWithSmartCache(
      restaurantId,

      async (id) => {
        return await getFoods(id);
      },

      (data, _fromCache) => {
        const processedData = processFoodsData(data);
        setFoods(processedData);
      },

      (freshData) => {
        const processedData = processFoodsData(freshData);
        setFoods(processedData);
      },
      
      (isLoading) => {
        setLoader(isLoading);
      }
    );

  }, [activeTab, restaurantData])
  
  const availableFilters = [
    { id: 'vegetarian', label: 'Vegetarian', icon: 'leaf' },
    { id: 'vegan', label: 'Vegan', icon: 'leaf-circle' },
    { id: 'spicy', label: 'Spicy', icon: 'fire' },
    { id: 'popular', label: 'Popular', icon: 'star' },
  ]
  
  const filteredFoods = useMemo(() => {
    let result = foods;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(food =>
        food.name?.toLowerCase().includes(query) ||
        food.description?.toLowerCase().includes(query)
      );
    }
    
    if (activeFilters.length > 0) {
      result = result.filter(food => {
        if (activeFilters.includes('vegetarian') && !food.tags?.includes('végétarien')) return false;
        if (activeFilters.includes('vegan') && !food.tags?.includes('vegan')) return false;
        if (activeFilters.includes('spicy') && !food.tags?.includes('épicé')) return false;
        if (activeFilters.includes('popular') && (!food.rating?.average || food.rating.average < 4)) return false;
        return true;
      });
    }

    return result;
  }, [foods, searchQuery, activeFilters]);

  const toggleFilter = useCallback((filterId) => {
    setActiveFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  }, []);

  if (loader)
    return <ActivityIndicator
      size="small"
      color={colors.primary}
      style={styles.indicator}
    />
  
  if (foods.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: colors.text.secondary }}>{i18n.t('menu.noProductsAvailable')}</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, }} >
      {}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="magnify" type="material-community" color={colors.text.secondary} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search menu items..."
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" type="material-community" color={colors.text.secondary} size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {availableFilters.map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              activeFilters.includes(filter.id) && styles.filterChipActive
            ]}
            onPress={() => toggleFilter(filter.id)}
          >
            <Icon
              name={filter.icon}
              type="material-community"
              size={16}
              color={activeFilters.includes(filter.id) ? colors.white : colors.text.secondary}
            />
            <Text style={[
              styles.filterChipText,
              activeFilters.includes(filter.id) && styles.filterChipTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {}
      {filteredFoods.length === 0 && foods.length > 0 && (
        <View style={styles.noResultsContainer}>
          <Icon name="magnify" type="material-community" color={colors.text.secondary} size={48} />
          <Text style={styles.noResultsText}>{i18n.t('menu.noItemsFound')}</Text>
          <Text style={styles.noResultsSubtext}>{i18n.t('menu.tryAdjustingSearch')}</Text>
        </View>
      )}

      {}
      {filteredFoods.length > 0 && categories && categories.length > 0 ? (
        <FlatList
          ref={foodsRef}
          data={categories}
          keyExtractor={(item, index) => index}
          renderItem={({ item, index }) => {
            let data = filteredFoods.filter((food) => food.category?.name === item.name || food.categoryId === item.id || food.category?._id === item.id || food.category === item.id)
            return (
              <View >
                {data.length > 0 ? <Text style={styles.groupTitle}>{item.name}</Text> : null}
                <FlatList
                  data={data}
                  keyExtractor={(foodItem) => `food-${foodItem.id}`}
                  renderItem={({ item, index: itemIndex }) => {
                    return (
                      <View key={itemIndex}>
                        <View style={styles.menuItemStyle}>
                          <View style={{
                            flexDirection: "row",

                          }}>
                            <View style={{
                              alignItems: "center",
                              marginBottom: 10
                            }}>
                              <FoodImage
                                food={item}
                                marginLeft={marginLeft ? marginLeft : 0}
                              />
                            </View>
                            <FoodInfo food={item} navigation={navigation} restaurant={restaurantData} />
                          </View>
                          <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
                            {item && item.id ? (
                              <AddToCartButton
                                key={`cart-btn-${item.id}`}
                                food={item}
                                restaurant={restaurantData}
                              />
                            ) : (
                              <Text style={{ color: colors.error, fontSize: 12 }}>
                                {i18n.t('menu.productNotAvailable')}
                              </Text>
                            )}
                          </View>
                        </View>
                        <Divider width={0.5} orientation="vertical" style={{
                          marginHorizontal: 20
                        }} />
                      </View>
                    )
                  }}
                />
              </View>
            )
          }}
          ListFooterComponent={() => <View style={{ height: 20 }} />}
          onScrollBeginDrag={() => {}}
          scrollEnabled={scrollEnabled}
          onScrollEndDrag={(e) => {
            if (e.nativeEvent.contentOffset.y === 0) {
              setCategoriesFood(false)
              opacity(0).then(() => {
                setScrollEnabled(false)
              })
            }
          }}
        />
      ) : (
        
        <View>
          <Text style={styles.groupTitle}>{i18n.t('menu.menuTitle')}</Text>
          <FlatList
            ref={foodsRef}
            data={filteredFoods} 
            keyExtractor={(item, index) => `food-${item.id || index}`}
            renderItem={({ item, index }) => {
              return (
                <View key={index}>
                  <View style={styles.menuItemStyle}>
                    <View style={{
                      flexDirection: "row",
                    }}>
                      <View style={{
                        alignItems: "center",
                        marginBottom: 10
                      }}>
                        <FoodImage
                          food={item}
                          marginLeft={marginLeft ? marginLeft : 0}
                        />
                      </View>
                      <FoodInfo food={item} navigation={navigation} restaurant={restaurantData} />
                    </View>
                    <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
                      {item && item.id ? (
                        <AddToCartButton
                          key={`cart-btn-${item.id}`}
                          food={item}
                          restaurant={restaurantData}
                        />
                      ) : (
                        <Text style={{ color: colors.error, fontSize: 12 }}>
                          {i18n.t('menu.productNotAvailable')}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Divider width={0.5} orientation="vertical" style={{
                    marginHorizontal: 20
                  }} />
                </View>
              )
            }}
            ListFooterComponent={() => <View style={{ height: 20 }} />}
            scrollEnabled={scrollEnabled}
            onScrollBeginDrag={() => {}}
            onScrollEndDrag={(e) => {
              if (e.nativeEvent.contentOffset.y === 0) {
                setCategoriesFood(false)
                opacity(0).then(() => {
                  setScrollEnabled(false)
                })
              }
            }}
          />
        </View>
      )}
    </View>
  )
}
const FoodInfo = (props) => {

  return (
    <TouchableOpacity
      style={{ flex: 3, justifyContent: "center", paddingHorizontal: 10 }}
      onPress={() => {
        props.navigation.navigate("MenuDetailScreen", { food: props.food, restaurant: props.restaurant })
      }}>
      <Text style={styles.titleStyle}>{props.food.name}</Text>
      <Text>{props.food.description}</Text>
      <Text>{props.food.price.toLocaleString(language, {
        style: "currency",
        currency: currency
      })}</Text>
    </TouchableOpacity>
  )
}
const FoodImage = ({ marginLeft: _marginLeft, ...props }) => {
  const [currentImage, setCurrentImage] = useState(
    props.food?.image || null
  );

  return (
    <View style={{
      flex: 1,
      justifyContent: "center",
      padding: 10
    }}>
      <Image
        source={currentImage ? { uri: currentImage } : require('../../assets/images/default-food.jpg')}
        style={{
          width: 100,
          height: 100,
          borderRadius: 8,
        }}
        resizeMode="cover"
        onError={() => {
          setCurrentImage(null);
        }}
      />
    </View>
  )
}
export const Quantity = ({ id, food, restaurant, screen }) => {
  const dispatch = useDispatch();
  const styleMds = {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
    alignItems: "center"
  }
  return (
    <View style={screen !== "mds" ? {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-around",
    } : styleMds}>
      <TouchableOpacity onPress={() => {
        const cartItem = {
          ...food,
          restaurantName: restaurant.name,
          restaurantImage: restaurant.image,
          restaurant: restaurant
        };
        dispatch({
          type: 'ADD_TO_CART',
          payload: cartItem
        });
      }}>
        <AntDesign name="pluscircle" size={screen === "mds" ? 40 : 20} color="black" style={{
          padding: 5,
        }} />
      </TouchableOpacity>
      <View>
        <Text style={{
          padding: 5
        }}>{useSelector(state => state.cartReducer).filter((food) => food.id === id).length}</Text>
      </View>
      <TouchableOpacity onPress={() => {
        dispatch({
          type: 'REMOVE_FROM_CARD',
          payload: id
        });
      }}>
        <AntDesign name="minuscircle" size={screen === "mds" ? 40 : 20} color="black" style={{
          padding: 5,
        }} />
      </TouchableOpacity>
    </View>
  )
}
