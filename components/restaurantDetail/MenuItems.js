import React, {useState, useEffect, useRef, createRef, useContext, useMemo, useCallback} from 'react'
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native'
import { Divider } from 'react-native-elements'
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { useDispatch, useSelector } from 'react-redux';
import {language, currency}  from '../../global'
import { AntDesign } from '@expo/vector-icons';
import { getFoods, getCategoriesFromRestaurant } from '../../api';
import { colors } from '../../global';
import Loader from '../../screens/Loader';
import AddToCartButton from '../AddToCartButton';  
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
export default function MenuItems({route, restaurant, activeTab, marginLeft, navigation, foodsRef,
pickup, delivery, setActiveTab, userLocation, mapRef, apikey, scrollEnabled, setScrollEnabled,
opacity, setCategoriesFood, hideHeader}) {
  // Get restaurant from props or route.params
  const restaurantData = restaurant || route?.params?.restaurant
  const {categories, setCategories} = useContext(CategoriesContext)
  const [foods, setFoods] = useState([])
  const [loader, setLoader] = useState(true)

  useEffect(()=>{
    if (!restaurantData) {
      console.log('❌ No restaurant data available');
      return;
    }

    console.log('🏪 Loading foods for restaurant:', {
      id: restaurantData.id,
      restaurantId: restaurantData.restaurantId,
      name: restaurantData.name,
      hasDishes: !!restaurantData.dishes,
      dishesCount: restaurantData.dishes?.length || 0
    });

    setLoader(true)
    const restaurantId = restaurantData.restaurantId || restaurantData.id;

    // Fetch categories for this restaurant
    getCategoriesFromRestaurant(restaurantId).then((restaurantCategories) => {
      console.log('Categories for restaurant:', restaurantCategories);
      // For now, just use all categories since the API returns all categories
      // In a real implementation, this should return categories specific to the restaurant
    }).catch(error => {
      console.error('Error fetching categories:', error);
    });

        getFoods(restaurantId).then((foods) => {
      console.log('=== API RESPONSE ===');
      console.log('Foods fetched from API:', foods?.length || 0);

      // Debug: Afficher les premières données reçues
      if (foods && Array.isArray(foods) && foods.length > 0) {
        console.log('🔍 Sample food data:', JSON.stringify(foods[0], null, 2));
        console.log('🔍 Image field check:', foods.slice(0, 3).map(f => ({ id: f.id || f._id, image: f.image, hasImage: !!f.image })));
      }

      if (foods && Array.isArray(foods) && foods.length > 0) {
        // Filtrer côté frontend : ignorer les produits sans image valide
        const foodsWithValidImages = foods.filter(food => {
          const hasValidImage = food &&
                               food.image &&
                               typeof food.image === 'string' &&
                               food.image.trim() !== '' &&
                               food.image !== 'null' &&
                               food.image !== 'undefined';

          // Debug: Log pourquoi chaque produit est filtré ou gardé
          if (!hasValidImage) {
            console.log('❌ Filtered out food:', { id: food.id || food._id, image: food.image, reason: !food.image ? 'no image field' : 'invalid image' });
          }

          return hasValidImage;
        });

        console.log(`📦 Received ${foods.length} foods from backend`);
        console.log(`✅ ${foodsWithValidImages.length} foods with valid images (filtered ${foods.length - foodsWithValidImages.length} without images)`);

        if (foodsWithValidImages.length === 0) {
          console.log('❌ No foods with valid images available');
          setFoods([]);
          setLoader(false);
          return;
        }

        const processedFoods = foodsWithValidImages.map(food => ({
          ...food,
          id: food.id || food._id,
          price: Number(food.price)
        }));

        console.log('🍽️ Final processed foods with images:', processedFoods.length);
        setFoods(processedFoods);
        setLoader(false);
        return;
      }

      // Si pas de données de l'API
      console.log('❌ No foods available from backend');
      setFoods([]);
      setLoader(false)
    }).catch(error => {
      console.error('❌ Error fetching foods from database:', error);
      setFoods([]);
      setLoader(false);
    })

  },[activeTab, restaurantData])
  if(loader)
    return <View>
      <View style={{marginBottom: 100}}></View>
      <Loader />
    </View>

  // If no foods loaded yet, show empty state
  console.log('Total foods loaded:', foods.length)
  if (foods.length === 0) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 16, color: colors.text.secondary}}>Aucun produit disponible</Text>
      </View>
    )
  }

  return (
    <View style={{flex: 1, }} >
      {/* If categories exist and have foods, group by categories */}
      {categories && categories.length > 0 ? (
        <FlatList
          ref={foodsRef}
          data={categories}
          keyExtractor={(item, index)=>index}
          renderItem={({item, index})=> {
            let data = foods.filter((food)=>food.category?.name === item.name || food.categoryId === item.id || food.category?._id === item.id || food.category === item.id)
            console.log(`Category ${item.name}: ${data.length} items`)
            return (
              <View >
               {data.length > 0 ? <Text style={styles.groupTitle}>{item.name}</Text> : null}
                <FlatList
                  data={data} // Le backend a déjà filtré les produits valides
                   keyExtractor={(item, index)=>`food-${item.id}`}
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
                          <FoodImage
                            food={item}
                            marginLeft={marginLeft ? marginLeft:0}
                          />
                       </View>
                  <FoodInfo food={item} navigation={navigation} restaurant={restaurantData}/>
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
                      Produit non disponible
                    </Text>
                  )}
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
          ListFooterComponent={()=><View style={{ height: 20}} />}
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
      ) : (
        /* If no categories, show all foods in one list */
        <View>
          <Text style={styles.groupTitle}>Menu</Text>
          <FlatList
            ref={foodsRef}
            data={foods} // Le backend a déjà filtré les produits valides
            keyExtractor={(item, index)=>`food-${item.id || index}`}
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
                        <FoodImage
                          food={item}
                          marginLeft={marginLeft ? marginLeft:0}
                        />
                      </View>
                  <FoodInfo food={item} navigation={navigation} restaurant={restaurantData}/>
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
                      Produit non disponible
                    </Text>
                  )}
                </View>
               </View>
                  <Divider width={0.5} orientation="vertical" style={{
                    marginHorizontal: 20
                  }}/>
                </View>
              )
            }}
            ListFooterComponent={()=><View style={{ height: 20}} />}
            scrollEnabled={scrollEnabled}
            onScrollBeginDrag={(e)=>{

            }}
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
      )}
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
const FoodImage = ({marginLeft,...props})=> {
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
 