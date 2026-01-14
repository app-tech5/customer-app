import { View, Text, FlatList, StyleSheet, TouchableOpacity} from 'react-native'
import React, { useEffect, useState } from 'react'
 import { getRestaurantsFromFirebase, searchRestaurantsByCategory } from '../api'
import { categories } from '../data'
import {RestaurantImage, RestaurantInfo} from '../components/home/RestaurantItems'
import Loader from './Loader'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n from '../i18n'

export default function SearchResults({route, navigation}) {
  const [restaurantData, setRestaurantData]= useState()
  const [loader, setLoader]  = useState(true)

  useEffect(()=>{
    const { categoryId, name, type } = route.params

    // Si on a un categoryId, c'est une recherche par catégorie
    if (categoryId) {
      searchRestaurantsByCategory(categoryId)
      .then(restaurantsResult => {
        setRestaurantData(restaurantsResult)
      })
    }
    // Si c'est une recherche "Top rated" spéciale
    else if (name === 'TOP_RATED_SPECIAL') {
      getRestaurantsFromFirebase()
      .then(restaurantsResult => {
        // Trier par rating décroissant (les mieux notés en premier)
        const sortedByRating = restaurantsResult
          .filter(restaurant => restaurant.rating) // Uniquement ceux qui ont un rating
          .sort((a, b) => (b.rating || 0) - (a.rating || 0)) // Tri décroissant
        setRestaurantData(sortedByRating)
      })
    }
    // Sinon c'est une recherche textuelle normale
    else if (name) {
      // Pour l'instant, on retourne tous les restaurants
      // TODO: Implémenter une vraie recherche textuelle
      getRestaurantsFromFirebase()
      .then(restaurantsResult => {
        // Filtrage simple côté client (temporaire)
        const filtered = restaurantsResult.filter(restaurant =>
          restaurant.name?.toLowerCase().includes(name.toLowerCase()) ||
          restaurant.description?.toLowerCase().includes(name.toLowerCase()) ||
          restaurant.city?.toLowerCase().includes(name.toLowerCase())
        )
        setRestaurantData(filtered.length > 0 ? filtered : restaurantsResult)
      })
    }

    // Définir le titre selon le type de recherche
    let title = 'Search Results'
    if (name === 'TOP_RATED_SPECIAL') {
      title = i18n.t ? i18n.t('search.topRated') : 'Top Rated'
    } else if (name) {
      title = name
    }
    navigation.setOptions({title})
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoader(false)
    }, 1500) // Réduit le temps de loading
    return () => clearTimeout(timer)
  }, [])

  if(loader) return <Loader />
  return (
    <View>
       <View>
         <FlatList
         data={restaurantData}
              keyExtractor={(item, index)=>String(index)}
              renderItem={({item})=>{
                return(
                   <TouchableOpacity onPress={()=>navigation.navigate("RestaurantDetail",
                   {
                     restaurant: item
                   })}
                   style={styles.itemContainer}>
                   <RestaurantImage image={item.image} />
                  <RestaurantInfo
                            name={item.name}
                            rating={item.rating}
                            city={item.city}/>
                    </TouchableOpacity>
                )
                }}/>
       </View>
    </View>
  )
}
const styles = StyleSheet.create({
  itemContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: "white",
  }
})