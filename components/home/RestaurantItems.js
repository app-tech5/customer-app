import { View, Text,Image, TouchableOpacity, FlatList, useWindowDimensions, StyleSheet} from 'react-native'
import React, {useState, useEffect, useRef} from 'react'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { AntDesign, Ionicons } from '@expo/vector-icons';
import Categories from './Categories';
import PromotionBadge from '../PromotionBadge';

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
                                    marginTop: 4,
                                    marginRight: 12,
                                    padding: 0,
                                    backgroundColor: "white",
                                    width: props.size ? width * props.size : width*0.8,
                                    borderRadius: 12,
                                    shadowColor: '#000',
                                    shadowOffset: {
                                      width: 0,
                                      height: 2,
                                    },
                                    shadowOpacity: 0.08,
                                    shadowRadius: 8,
                                    elevation: 3,
                                    borderWidth: 1,
                                    borderColor: '#F2F2F7',
                                    overflow: 'hidden'
                                }}>
                                {props.reward || item.reward ?<PromotionBadge restaurant={item} allPromotions={props.promotions} allMenus={props.allMenus}/>:<></>}
                                <RestaurantImage image={item.image} />
                                {props.ads && <Affiche ads={item.ads} adsColor={item.adsColor}/>}
                                <RestaurantInfo
                                    name={item.name.substring(0,25)}
                                    rating={item.rating}
                                    city={item.city}
                                    distance={item.distance}/>
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
            style={{
                width: "100%",
                height: 120,
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10
            }}
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
        alignItems: "flex-start",
        marginTop: 8,
        paddingHorizontal: 2
        }}>
        <View style={{ flex: 1, marginRight: 8 }}>
            <Text
                style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: '#1C1C1E',
                    marginBottom: 4,
                    lineHeight: 18
                }}
                numberOfLines={2}
            >
                {props.name}
            </Text>
            <Text
                style={{
                    fontSize: 12,
                    color: "#8E8E93",
                    marginBottom: 2
                }}
            >
                {props.city}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{
                    fontSize: 12,
                    color: "#8E8E93"
                }}>
                    {props.distance ? `${props.distance.toFixed(1)} km • ` : ''}30-45 min
                </Text>
                {props.distance && (
                    <Ionicons
                        name="location"
                        size={11}
                        color="#34C759"
                        style={{ marginLeft: 2 }}
                    />
                )}
            </View>
        </View>
        <View style={{
                backgroundColor: "#FFF",
                height: 28,
                minWidth: 36,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#F2F2F7',
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 1,
                },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="star" size={12} color="#FF9500" />
                <Text style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: '#FF9500',
                    marginLeft: 2
                }}>
                    {props.rating ? parseFloat(props.rating).toFixed(1) : 'N/A'}
                </Text>
            </View>
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