import { View, Text, StyleSheet,Image, ScrollView, TouchableOpacity} from 'react-native'
import React, {useState, useEffect, useRef, createRef, useContext} from 'react'
import { Divider } from 'react-native-elements';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { useDispatch, useSelector } from 'react-redux';
import {language, currency}  from '../../global'
import {} from 'react-native-tab-view'
import { NavigationContainer } from '@react-navigation/native';
import { restaurants } from '../../data';
import { AntDesign } from '@expo/vector-icons';
import { getFoods } from '../../firebase';
import Loader from '../../screens/Loader';
import QuantityAnimate from '../Quantity';  
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import About from './About';
import HeaderTabs from '../home/HeaderTabs';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { groupFoods } from '../../data';
import { FlatList } from 'react-native-gesture-handler';
import { CategoriesContext } from '../../contexts/CategoriesContext';

  const styles = StyleSheet.create({
    menuItemStyle :{flex: 1,},
    titleStyle: {
      fontSize: 19,
      fontFamily: "Roboto_500Medium"
    },
    groupTitle: {
     fontSize: 25,
     marginLeft: 20,
     fontWeight: "bold",
     marginVertical: 10
    }
}) 
export default function MenuItems({route, activeTab, marginLeft, navigation, foodsRef,
pickup, delivery, setActiveTab, userLocation, mapRef, apikey, scrollEnabled, setScrollEnabled,
opacity, setCategoriesFood}) {
  const {restaurant} = route.params
  const {categories, setCategories} = useContext(CategoriesContext)
  const [foods, setFoods] = useState([])
   const [loader, setLoader] = useState(false)

  useEffect(()=>{
      //  setLoader(true)
        getFoods(restaurant.restaurantId).then((foods) => {
          // const wait = new Promise(resolve => setTimeout(resolve, 2000));
          // wait.then(()=>{
            setFoods(foods.map(food => ({...food, price: Number(food.price)}) ))
              // setLoader(false)
          // })
        })
          // .then(() => {
          //   setLoader(false)
          // })
      
  },[activeTab])
  if(loader)
  return <View>
  <About route={route} navigation={navigation} userLocation={userLocation} mapRef={mapRef} apikey={apikey} categories={categories} setCategories={setCategories}/>
  <HeaderTabs pickup={pickup} delivery={delivery} activeTab={activeTab} setActiveTab={setActiveTab}/>
  <View style={{marginBottom: 100}}></View>
  <Loader />
  </View>
  return (
    <View style={{flex: 1, }} >
      <FlatList
      ref={foodsRef}
      //  data={groupFoods}
      data={categories.filter(category => category.type === "food")}
      keyExtractor={(item, index)=>index}
      renderItem={({item, index})=> {
        let data = foods.filter((food)=>food.category === item.name)
        return (
          <View >
           {data.length? <Text style={styles.groupTitle}>{item.name}</Text>:<></>} 
            <FlatList 
              //  data={foods.filter((food)=>food.group === item.id)}
              data={data}
               keyExtractor={(item, index)=>index}
               renderItem={({item, index})=>{
                return (
                  <View key={index} >
               <View style={styles.menuItemStyle}>
                   <View style={{
                     flexDirection: "row",
                      
                   }}>
                   <View style={{
                     alignItems: "center",
                     marginBottom: 10
                   }}>
                      <FoodImage food={item} marginLeft={marginLeft ? marginLeft:0}
                       />
                       <QuantityAnimate id={item.id} food={item} restaurant={restaurant}/>
                   </View>
                  <FoodInfo food={item} navigation={navigation} restaurant={restaurant}/>
                   </View>
               </View>
               <Divider width={0.5} orientation="vertical" style={{
                 marginHorizontal: 20
               }}/>
                 </View>
                )
              }}
            />
          </View>
        )
      }}
      ListHeaderComponent={()=> <View>
        <About route={route} navigation={navigation} userLocation={userLocation} mapRef={mapRef} apikey={apikey}/>
        <HeaderTabs pickup={pickup} delivery={delivery} activeTab={activeTab} setActiveTab={setActiveTab}/>
        </View>}
      ListFooterComponent={()=><View style={{ height: 250}} />}
      onScrollBeginDrag={(e)=>{
      }}
       scrollEnabled={scrollEnabled}
       onScrollEndDrag={(e)=>{
        if(e.nativeEvent.contentOffset.y === 0){
        setCategoriesFood(false)
        opacity(0).then(()=>{
          setScrollEnabled(false)
       })
      }
       }}
       />
    </View>
  )
}
const FoodInfo = (props)=>{
  
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
)}
const FoodImage = ({marginLeft,...props})=>(
  <View style={{
    flex: 1,
    justifyContent: "center",
    padding: 10
  }}>
    <Image source={{ uri: props.food.image }}
      style={{
        width: 100,
        height: 100,
        borderRadius: 8,
      }}  />
  </View>
)
export const Quantity = ({id, food, restaurant, screen}) => {
  const dispatch = useDispatch();
  const styleMds={
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
    alignItems: "center"
  }
  return (
    <View style={screen !=="mds"?{
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-around",
    }:styleMds}>
      <TouchableOpacity onPress={() => {
        dispatch({
          type: 'ADD_TO_CART',
          payload: {
            ...food,
            restaurantName: restaurant.name,
            restaurantImage: restaurant.image,
            restaurant: restaurant
          }
        });
      }}>
        <AntDesign name="pluscircle" size={screen === "mds"?40:20} color="black" style={{
          padding: 5,
        }} />
      </TouchableOpacity>
      <View>
        <Text style={{
          padding: 5
        }}>{useSelector(state => state.cartReducer).filter((food)=>food.id === id).length}</Text>
      </View>
      <TouchableOpacity onPress={() => {
        dispatch({
          type: 'REMOVE_FROM_CARD',
          payload: id
        });
      }}>
        <AntDesign name="minuscircle" size={screen === "mds"?40:20} color="black" style={{
        padding: 5,
        }} />
      </TouchableOpacity>
    </View>
  )
}
 