import { View, Text, Image, StyleSheet, ScrollView} from 'react-native'
import React, { useState } from 'react'
import {language, currency}  from '../global'
import { CheckBox } from 'react-native-elements'
import { Quantity } from '../components/restaurantDetail/MenuItems'
import ViewCart from '../components/restaurantDetail/ViewCart'
import DisplayPreferences from '../components/DisplayPreferences'
import Size from '../components/Size'
export default function MenuDetailScreen({route}) {
  const {food, restaurant} = route.params
  const [checkbox1, setCheckbox1] = useState(true)
  const [checkbox2, setCheckbox2] = useState(false)
  return (
    <>
    <ScrollView style={styles.container} >
      <Image source={{uri: food.image}} style={styles.image}/> 
      <View style={styles.section1}>
        <Text style={styles.title}>{food.name}</Text>
        <Text style={styles.price}>{Number(food.price).toLocaleString(language, {style: "currency",currency: currency})}</Text>
        <Text style={styles.description}>{food.description}</Text>
      </View>
      <View style={styles.divider1}></View>

      <Size food={food} restaurant={restaurant}/>
      <View style={styles.section2}>
      {/* <DisplayPreferences /> */}
       
      </View>
      <Quantity id={food.id} food={food} restaurant={restaurant} screen="mds"/>
      <View style={{height: 100}} />
    </ScrollView>
     <ViewCart params={{restaurant: restaurant}} />
    </>
  )
}
const styles = StyleSheet.create({
  container:{
    flex: 1,
  },
  image: {
    width: "100%",
    height: 200,
  },
  section1:{
    marginLeft: 15,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 10
  },
  price: {
    fontSize: 30,
  },
  description: {
   fontSize: 20,
   color: "grey"
  },
  divider1:{
    borderBottomWidth: 10,
    borderBottomColor: "#d9d9d9",
    marginVertical: 20
  },
  section2: {
    marginLeft: 15,
  },
  title1: {
    fontSize: 20,
    fontWeight: "bold",
  }
})