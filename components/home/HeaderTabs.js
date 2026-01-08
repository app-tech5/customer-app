import { View, Text, TouchableOpacity, StyleSheet, Platform} from 'react-native'
import React, {useState} from 'react'
import { grey1 } from '../../global'

export default function HeaderTabs(props) {
  return (
    <View style={{flexDirection: "row",...props.pickup || props.delivery?{...styles.pickup_delivery}:{alignSelf: "center"}}}>
        <HeaderButton 
            text="Delivery" 
            btnColor="black" 
            textColor="white" 
            activeTab={props.activeTab} 
            setActiveTab={props.setActiveTab}
            delivery={props.delivery}
            setCity={props.setCity}
            searchbar={props.searchbar}/>
        <HeaderButton 
            text="Pickup" 
            btnColor="white" 
            textColor="black" 
            activeTab={props.activeTab} 
            setActiveTab={props.setActiveTab}
            navigation={props.navigation}
            restaurantData={props.restaurantData}
            pickup={props.pickup}/>
    </View>     
  )
}
const HeaderButton = (props) => (
    <TouchableOpacity style={props.pickup || props.delivery?{
        backgroundColor: props.activeTab == props.text?"white":grey1,
        ...styles.button1
    }:{
        backgroundColor: props.activeTab == props.text?"black":"white",
        ...styles.button 
    }} 
    onPress={()=>{
        if(props.setActiveTab)
        props.setActiveTab(props.text)
        if(props.text && props.navigation)
        if(props.text === 'Pickup') props.navigation.navigate('RestaurantsMapScreen',{
          restaurantData: props.restaurantData
        })
        if(props.text === 'Delivery' && !props.delivery){
            props.setCity(null)
            props.searchbar.current?.setAddressText("")
        }
        if(props.pickup){
            props.pickup()
        }
        if(props.delivery){
            props.delivery()
        }
    }}
    >
        <Text style={props.pickup || props.delivery?{
           ...styles.text1 
        }:{
            ...styles.text, color:props.activeTab == props.text ?"white":"black" }}>{props.text}</Text>
    </TouchableOpacity>
)
const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
    },
    button: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    text: {
        fontSize: 15,
        fontWeight: Platform.OS === "android" ? "bold" : "900"
    },
    pickup_delivery: {
      backgroundColor: grey1,
      marginHorizontal: 20,
      paddingHorizontal: 5,
      borderRadius: 30,
      marginVertical: 5
    },
    button1:{
        borderRadius: 30,
        marginVertical: 5,
        flex: 1,
    },
    text1: {
        textAlign: "center",
        paddingVertical: 10,
    }
})