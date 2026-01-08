import { View, Text,Image, TouchableOpacity, FlatList, useWindowDimensions, StyleSheet} from 'react-native'
import React, {useState, useEffect, useRef} from 'react'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { AntDesign } from '@expo/vector-icons';
import Categories from './Categories';
import Reward from '../Reward';

export default function RestaurantItems({navigation,...props}) {
    const { width, height } = useWindowDimensions();
  return (
      <View style={{
          }}>
              <FlatList 
                  ref={props.flatlist}
                  data={props.reward?props.restaurantData.filter(restaurant => restaurant.reward === props.reward):props.ads?props.restaurantData.filter(restaurant => restaurant.ads ):props.restaurantData}
                  keyExtractor={(item, index)=>index}
                  renderItem={({item, index})=> {
                    return (
                        <TouchableOpacity 
                        key={index}
                        activeOpacity={1} 
                        style={{
                        }}
                        onPress={()=>navigation.navigate("RestaurantDetail",
                        {
                          restaurant: item
                        })}
                        >
                            <View  
                                style={{
                                    marginTop: 8,
                                    padding: 15,
                                    backgroundColor: "white",
                                   width: props.size?width:width*0.8
                                }}>
                                <View >
                                    <RestaurantImage image={item.image} />
                                    {props.reward || item.reward ?<Reward restaurant={item}/>:<></>}
                                    {props.ads && <Affiche ads={item.ads} adsColor={item.adsColor}/>}
                                </View>
                                <RestaurantInfo 
                                    name={item.name.substring(0,20)}
                                    rating={item.rating} 
                                    city={item.city}/>
                            </View>
                        </TouchableOpacity>
                    )
                  }}
                  horizontal={props.horizontal}
                  showsHorizontalScrollIndicator={false}
              />
      </View>
  )
}
export const RestaurantImage= (props)=>{
    const [liked, setLiked] = useState(false)
    return(
    <>
        <Image
            source={{
                uri: props.image
            }}
            style={{ width: "100%", height: 140 }}
        />
        <TouchableOpacity style={{position: 'absolute', right: 20, top: 20}}>
            {liked?(<AntDesign
                name='heart' 
                size={25}
                color="red"
                onPress={()=>setLiked(false)}
                />
            ):(
                <MaterialCommunityIcons 
                name="heart-outline" 
                size={25} 
                color='#fff'
                onPress={()=>setLiked(true)}
                />
            )}
        </TouchableOpacity>
    </>
)}
export const RestaurantInfo = (props)=>(
    <View style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
        }}>
        <View>
            <Text style={{
                fontSize: 15,
                fontWeight:"bold",
            }}>{props.name} - {props.city}</Text>
            <Text style={{
                fontSize: 13,
                color: "grey"
            }}>30-45 - min</Text>
        </View>
        <View style={{
                backgroundColor: "#eee",
                height: 30,
                width: 30,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 15,
            }}>
            <Text>{props.rating}</Text>
        </View>
    </View>
)
const Affiche = (props)=> {
    return (
      <View style={styles.container}>
          <View style={{...styles.container1, backgroundColor: props.adsColor}}>
            <Text style={{...styles.text, color: props.adsColor==="#800000"?"white":"black"}}>{props.ads}</Text>
            <View style={styles.button}>
              <Text style={styles.buttonText}>Browse Offers</Text>
              <AntDesign name="arrowright" size={18} color="black" />
            </View>
          </View>
      </View>
    )
  }
  const styles = StyleSheet.create({
    container: {
      position: "absolute",
      height: "100%",
      width: "100%"
    },
    container1: {
        backgroundColor: "#e0ccff",
       height: "100%",
        padding: 10,
        width: "60%"
    },
    button: {
      flexDirection: "row",
      paddingVertical: 2,
     backgroundColor: "white",
      marginTop: 5,
      width: 125,
      paddingHorizontal: 6,
      borderRadius: 10,
      justifyContent: "space-between",
      alignItems: "center",
    },
    buttonText: {
        fontFamily: "Roboto_500Medium"  
    },
    text: {
        fontSize: 25,
        fontFamily: "Roboto_500Medium"
    }
  })