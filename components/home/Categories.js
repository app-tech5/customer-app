import { View, Text, Image, ScrollView, TouchableOpacity, Platform } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { FlatList } from 'react-native-gesture-handler';
import { getCategories, getCategoriesRestaurants } from '../../api';
import { CategoriesContext } from '../../contexts/CategoriesContext';

// Image par défaut locale
const defaultImage = require('../../assets/images/default-food.jpg');

export default function Categories({navigation}) {
  // const [categories, setCategories] = useState([])
  const {categories, setCategories} = useContext(CategoriesContext)

  const [categoriesRestaurants, setCategoriesRestaurants] = useState()
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
      paddingVertical: 10,
      paddingLeft: 10,
    }}>
      {categories?<FlatList
        horizontal
        data={categories.filter(category => category.type !== "food")}
        keyExtractor={(item, index) => index}
        renderItem={({ item, index }) => {
          return (
            <TouchableOpacity
            onPress={()=>navigation.navigate("Search",{
              screen: "SearchResults",
              params: {
                categoryId: item.id,
                categoryName: item.name
              }
            })}
            style={{ alignItems: "center", marginRight: 30 }}>
              <Image
                source={imageErrors[item.id || item.name] ? defaultImage : {uri: item.image}}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                }}
                onError={() => handleImageError(item.id || item.name)}
              />
              <Text style={{
                fontSize: 13,
                fontWeight: Platform.OS === "android" ? "bold" : "900"
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