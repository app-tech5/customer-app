import { View, Text, FlatList, Image} from 'react-native'
import React, { useEffect, useState } from 'react'
import { getOrders } from '../firebase'

export default function OrdersScreen() {

    const [orders, setOrders] = useState()
    
   useEffect(()=>{
    getOrders().then((orders)=>setOrders(orders))
    },[])
  return (
    <View>

       
       <FlatList
       
       data={orders}
            keyExtractor={(item, index)=>String(index)}
            renderItem={({item})=>{
              
              return(
                <View style={{
                    flexDirection: "row",
                    margin: 10
                }}>
                    <Image 
                    source={{uri: item.image}}
                    style={{
                        width: 100, 
                        height: 100,
                        borderRadius: 10}}/>

                    <View style={{
                        margin: 10,
                        justifyContent: "center"
                    }}>
                    <Text style={{
                        fontWeight: "bold"
                    }}>{item.title}</Text>
                    </View>
                </View>
              )
              
              }}/>
    </View>
  )
}