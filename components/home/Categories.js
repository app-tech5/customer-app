import { View, Text, Image, TouchableOpacity, Platform } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { FlatList } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native'
import { getCategories } from '../../api';
import { CategoriesContext } from '../../contexts/CategoriesContext';
import { navigateToTabSearch } from '../../navigation/navigationHelpers';

const defaultImage = require('../../assets/images/category-placeholder.jpg');

export default function Categories({ navigation: navigationProp, searchResultParams = {} }) {
  const navigationFromHook = useNavigation()
  const navigation = navigationProp ?? navigationFromHook
  
  const {categories, setCategories} = useContext(CategoriesContext)

  const [imageErrors, setImageErrors] = useState({})

  useEffect(()=> {
    getCategories().then(categories => setCategories(categories))
  }, [])

  const handleImageError = (categoryId) => {
    setImageErrors(prev => ({
      ...prev,
      [categoryId]: true
    }))
  }
  return (
    <View style={{
      marginTop: 5,
      backgroundColor: "#fff",
      paddingVertical: 14,
      paddingLeft: 16,
    }}>
      {categories?<FlatList
        horizontal
        data={categories.filter(category => category.type !== "food")}
        keyExtractor={(item, index) => index}
        renderItem={({ item, index: _index }) => {
          return (
            <TouchableOpacity
            onPress={() => navigateToTabSearch(navigation, 'SearchResults', {
              categoryId: item.id,
              categoryName: item.name,
              ...searchResultParams,
            })}
            style={{ alignItems: "center", marginRight: 22, width: 72 }}>
              <Image
                source={imageErrors[item.id || item.name] ? defaultImage : {uri: item.image}}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  borderWidth: 1,
                  borderColor: "#ececec",
                }}
                onError={() => handleImageError(item.id || item.name)}
              />
              <Text
                numberOfLines={1}
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  fontWeight: Platform.OS === "android" ? "bold" : "700",
                  color: "#111",
                  textAlign: "center",
                }}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )
        }}
        showsHorizontalScrollIndicator={false}
      />:<></>}
      
    </View>
  )
}