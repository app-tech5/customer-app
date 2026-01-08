import { View, Text } from 'react-native'
import React, { useState } from 'react'
import {GooglePlacesAutocomplete}  from 'react-native-google-places-autocomplete'
import Ionicons from 'react-native-vector-icons/Ionicons'
import AntDesign from 'react-native-vector-icons/AntDesign' 
import { apikey } from '../../global'
import { location } from '../../utils'

export default function SearchBar({searchbar, cityHandler, style, setAddress, navigation, restaurantData}) {
  const [value, setValue] = useState()
  return (
    <View style={{marginTop: 15, flexDirection: "row"}}>
      <GooglePlacesAutocomplete 
      ref={searchbar}
      query={{ 
        key: apikey,
        language: 'en',
      }}
      fetchDetails
      onPress={(data, details=null)=>{
          const city = data.description.split(',')[0];
          if(!style)
          cityHandler(city)
          if(style){
          setAddress({
            description: data.description,
            location: details?.geometry?.location
          })
        }
      }}
      placeholder={!style?"Search":"Address"}
      styles={{
        textInput :{
            backgroundColor: !style?'#eee':style.backgroundColor,
            borderRadius : 20,
            fontWeight: "700",
            marginTop: 7,
        },
        textInputContainer:{
            backgroundColor: !style?'#eee':style.backgroundColor,
            borderRadius: !style?50:0,
            flexDirection: "row",
            alignItems: "center",
            marginRight : 10,
            ...style?{borderBottomWidth: style.borderBottomWidth, borderBottomColor: style.borderBottomColor}:{}
        }  
          }}
          renderLeftButton={()=>(
            <View style={{marginLeft: 10}}>
                <Ionicons name="location-sharp" size={24} />
            </View>
          )} 
          renderRightButton={!style?()=>(
          <View style={{
             flexDirection: "row",
             marginRight: 8,
             backgroundColor:"white",
             padding: 9,
             borderRadius: 30,
             alignItems: "center",
          }}>
              <AntDesign name='clockcircle' size={11}
               style={{marginRight: 6}}/>
              <Text>Search</Text>
          </View>
          ):()=>{}}
          //  textInputProps={{
          //   onTouchStart: ()=>  {
          //     location().then(Location =>{
                 
          //       Location.getCurrentPositionAsync({})
          //       .then(location => 
          //         // location
          //          Location.reverseGeocodeAsync({
          //            latitude: location.coords.latitude,
          //            longitude: location.coords.longitude
          //          })
          //          .then(res => {
          //            let addr = (res[0]?.streetNumber +' ' || '') + res[0]?.street +' '+ res[0]?.city
          //            console.log(addr)
          //            setValue(addr)
          //          })
          //       )
                
          //     })
          //     // alert("Hello...")
          //   },
          // value: address,

          // ...address?{
          //   value: address,
          //    onChangeText: (text) => {
          //      if(text)
          //       setAddress("fvffbbgd")
               
          //     }
          // }:{}
              
          //  }}
          />
    </View>
  )
}