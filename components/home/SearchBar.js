import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons'
import AntDesign from 'react-native-vector-icons/AntDesign'

export default function SearchBar({searchbar, cityHandler, style, setAddress, navigation, restaurantData}) {
  const [searchText, setSearchText] = useState('')

  const handleSearch = () => {
    if (!searchText.trim()) return

    // Recherche locale dans les restaurants par nom ou ville
    const filteredRestaurants = restaurantData.filter(restaurant =>
      restaurant.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      restaurant.city?.toLowerCase().includes(searchText.toLowerCase())
    )

    // Navigation vers les résultats de recherche dans le SearchNavigator
    navigation.navigate('Search', {
      screen: 'SearchResults',
      params: {
        searchTerm: searchText,
        restaurantData: filteredRestaurants,
        totalResults: filteredRestaurants.length
      }
    })
  }

  const handleSubmitEditing = () => {
    handleSearch()
  }

  return (
    <View style={{marginTop: 15, flexDirection: "row"}}>
      <View style={{
        backgroundColor: !style?'#eee':style.backgroundColor,
        borderRadius: !style?50:0,
        flexDirection: "row",
        alignItems: "center",
        marginRight: 10,
        flex: 1,
        ...style?{borderBottomWidth: style.borderBottomWidth, borderBottomColor: style.borderBottomColor}:{}
      }}>
        <View style={{marginLeft: 10}}>
          <Ionicons name="location-sharp" size={24} />
        </View>
        <TextInput
          ref={searchbar}
          style={{
            flex: 1,
            backgroundColor: !style?'#eee':style.backgroundColor,
            borderRadius: 20,
            fontWeight: "700",
            marginTop: 7,
            paddingHorizontal: 10,
            paddingVertical: 10,
          }}
          placeholder={!style?"Rechercher un restaurant ou une ville":"Address"}
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSubmitEditing}
          returnKeyType="search"
        />
        {!style && (
          <TouchableOpacity
            style={{
              flexDirection: "row",
              marginRight: 8,
              backgroundColor:"white",
              padding: 9,
              borderRadius: 30,
              alignItems: "center",
            }}
            onPress={handleSearch}
          >
            <AntDesign name='clockcircle' size={11} style={{marginRight: 6}}/>
            <Text>Rechercher</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}