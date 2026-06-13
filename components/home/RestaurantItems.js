import { View, Text,Image, TouchableOpacity, FlatList, useWindowDimensions, StyleSheet} from 'react-native'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { AntDesign, Ionicons } from '@expo/vector-icons';
import PromotionBadge from '../PromotionBadge';
import { colors, formatRestaurantRatingDisplay } from '../../global';
import i18n from '../../lang/i18n';
import { addToFavorites, removeFromFavorites } from '../../api';

const isFavoriteId = (favoriteIds, restaurantId) =>
  favoriteIds.some((id) => String(id) === String(restaurantId))

export default function RestaurantItems({navigation,...props}) {
    const { width } = useWindowDimensions();
  return (
      <View style={{
          }}>
              <FlatList 
                  ref={props.flatlist}
                  data={props.reward?props.restaurantData.filter(restaurant => restaurant.reward === props.reward):props.ads?props.restaurantData.filter(restaurant => restaurant.ads ):props.restaurantData}
                  keyExtractor={(item, index)=> String(item?._id || item?.id || index)}
                  ListHeaderComponent={props.ListHeaderComponent}
                  ListEmptyComponent={props.ListEmptyComponent}
                  refreshing={props.refreshing}
                  onRefresh={props.onRefresh}
                  contentContainerStyle={props.contentContainerStyle}
                  showsVerticalScrollIndicator={props.showsVerticalScrollIndicator ?? !props.horizontal}
                  renderItem={({item, index})=> {
                    return (
                        <TouchableOpacity
                        key={index}
                        activeOpacity={1}
                        style={{
                        }}
                        onPress={() => {
                          if (props.onRestaurantPress) {
                            props.onRestaurantPress(item)
                            return
                          }
                          navigation.navigate('RestaurantDetail', { restaurant: item })
                        }}
                        >
                            <View
                                style={{
                                    marginTop: 4,
                                    marginRight: 12,
                                    padding: 0,
                                    backgroundColor: "white",
                                    width: props.size ? width * props.size : width*0.8,
                                    borderRadius: 12,
                                    shadowColor: colors.shadow,
                                    shadowOffset: {
                                      width: 0,
                                      height: 2,
                                    },
                                    shadowOpacity: 0.08,
                                    shadowRadius: 8,
                                    elevation: 3,
                                    borderWidth: 1,
                                    borderColor: colors.border.light,
                                    overflow: 'hidden'
                                }}>
                                {props.reward || item.reward ?<PromotionBadge restaurant={item} allPromotions={props.promotions} allMenus={props.allMenus}/>:<></>}
                                <RestaurantImage
                                    image={item.image}
                                    restaurantId={item._id || item.id || item.restaurantId}
                                    onFavoriteChange={props.onFavoriteChange}
                                />
                                {props.ads && <Affiche ads={item.ads} adsColor={item.adsColor}/>}
                                <RestaurantInfo
                                    name={item.name.substring(0,25)}
                                    rating={item.rating}
                                    review_count={item.review_count}
                                    city={item.city}
                                    distance={item.distance}
                                    deliveryTime={item.deliveryTime}
                                    collectTime={item.collectTime}/>
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
export const RestaurantImage = (props) => {
    const dispatch = useDispatch()
    const favoriteIds = useSelector((state) => state.userReducer?.favorites || [])
    const restaurantId = props.restaurantId
    const isFavorite = restaurantId
        ? isFavoriteId(favoriteIds, restaurantId)
        : Boolean(props.isFavorite)

    const handleToggleFavorite = async () => {
        if (!restaurantId) return

        try {
            if (isFavorite) {
                await removeFromFavorites(restaurantId)
                dispatch({ type: 'REMOVE_FAVORITE', payload: restaurantId })
                props.onFavoriteChange?.(restaurantId, false)
            } else {
                await addToFavorites(restaurantId)
                dispatch({ type: 'ADD_FAVORITE', payload: restaurantId })
                props.onFavoriteChange?.(restaurantId, true)
            }
        } catch (error) {
            console.error('Error toggling favorite:', error)
        }
    }

    return (
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
            <TouchableOpacity
                style={{ position: 'absolute', right: 20, top: 20 }}
                onPress={handleToggleFavorite}
                activeOpacity={0.7}
            >
                {isFavorite ? (
                    <AntDesign name="heart" size={25} color="red" />
                ) : (
                    <MaterialCommunityIcons name="heart-outline" size={25} color="#fff" />
                )}
            </TouchableOpacity>
        </>
    )
}
export const RestaurantInfo = (props) => {
  const distanceValue = Number(props.distance)
  const hasDistance = Number.isFinite(distanceValue)

  return (
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
                    color: colors.text.primary,
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
                    color: colors.text.secondary,
                    marginBottom: 2
                }}
            >
                {props.city}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{
                    fontSize: 12,
                    color: colors.text.secondary
                }}>
                    {hasDistance ? `${distanceValue.toFixed(1)} km • ` : ''}
                    {props.deliveryTime ? `${props.deliveryTime} ${i18n.t('restaurant.deliveryTime')}` : props.collectTime ? `${props.collectTime} ${i18n.t('restaurant.collectTime')}` : i18n.t('restaurant.unknownTime')}
                </Text>
                {hasDistance && (
                    <Ionicons
                        name="location"
                        size={11}
                        color={colors.success}
                        style={{ marginLeft: 2 }}
                    />
                )}
            </View>
        </View>
        <View style={{
                backgroundColor: colors.background.card,
                height: 28,
                minWidth: 36,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border.light,
                shadowColor: colors.shadow,
                shadowOffset: {
                  width: 0,
                  height: 1,
                },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="star" size={12} color={colors.rating} />
                <Text style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.rating,
                    marginLeft: 2
                }}>
                    {formatRestaurantRatingDisplay(props.rating, props.review_count)}
                </Text>
            </View>
        </View>
    </View>
  )
}
const Affiche = (props)=> {
    return (
      <View style={styles.container}>
          <View style={{...styles.container1, backgroundColor: props.adsColor}}>
            <Text style={{...styles.text, color: props.adsColor==="#800000"?"white":"black"}}>{props.ads}</Text>
            <View style={styles.button}>
              <Text style={styles.buttonText}>{i18n.t('restaurant.browseOffers')}</Text>
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