import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import React, { useState, useEffect } from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons'
import i18n from '../../lang/i18n'

export default function SearchBar({
  searchbar,
  cityHandler: _cityHandler,
  style,
  setAddress: _setAddress,
  navigation,
  restaurantData,
  inputTestID,
  submitTestID,
}) {
  const [searchText, setSearchText] = useState('')
  
  useEffect(() => {
    if (searchbar && searchbar.current) {
      searchbar.current.setAddressText = (text) => {
        setSearchText(text)
      }
    }
  }, [searchbar])

  const handleSearch = () => {
    if (!searchText.trim()) {
      return
    }

    if (!restaurantData || !Array.isArray(restaurantData)) {
      return
    }

    const filteredRestaurants = restaurantData.filter(restaurant =>
      restaurant?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      restaurant?.city?.toLowerCase().includes(searchText.toLowerCase())
    )

    navigation.navigate('SearchFlow', {
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
          testID={inputTestID}
          accessibilityLabel={inputTestID}
          style={{
            flex: 1,
            backgroundColor: !style?'#eee':style.backgroundColor,
            borderRadius: 20,
            fontWeight: "700",
            marginTop: 7,
            paddingHorizontal: 10,
            paddingVertical: 10,
          }}
          placeholder={!style ? i18n.t('search.restaurantOrCity') : i18n.t('search.address')}
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSubmitEditing}
          returnKeyType="search"
        />
        {!style && (
          <TouchableOpacity
            testID={submitTestID}
            accessibilityLabel={submitTestID}
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
            <Ionicons name='search' size={11} style={{marginRight: 6}}/>
            <Text>{i18n.t('search.search')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}