import { View, Text, Image, ScrollView, TouchableOpacity, Platform } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { FlatList } from 'react-native-gesture-handler';
import { getCategories, getCategoriesRestaurants } from '../../api';
import { CategoriesContext } from '../../contexts/CategoriesContext';

export default function Categories({navigation}) {
  // const [categories, setCategories] = useState([])
  const {categories, setCategories} = useContext(CategoriesContext)

  const [categoriesRestaurants, setCategoriesRestaurants] = useState()
  useEffect(()=> {
    getCategories().then(categories => setCategories(categories))
  }, [])
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
            onPress={()=>navigation.navigate("SearchResults",{
              categoryId: item.id
            })}
            style={{ alignItems: "center", marginRight: 30 }}>
              <Image source={{uri: item.image}} style={{
                width: 40,
                height: 40,
                borderRadius: 20,
              }}
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