import { View, Text, StyleSheet, TouchableOpacity} from 'react-native'
import React from 'react'
import { Entypo, FontAwesome, FontAwesome5, Ionicons, MaterialIcons} from '@expo/vector-icons'
  
 
 

export default function AccountScreen({navigation}) {
   
  return (
    <View style={styles.container}>
       <View style={styles.line}>
        <Ionicons name="person-circle-outline" size={25} color="black" />
        <Text style={styles.text}>John Joe</Text>
      </View>
      <View style={styles.line}>
        <FontAwesome5 name="tasks" size={20} color="black" />
        <Text style={styles.text}>Orders</Text>
      </View>
      <View style={styles.line}>
        <FontAwesome name="heart" size={20} color="black" />
        <Text style={styles.text}>Your Favorites</Text>
      </View>
      <TouchableOpacity style={styles.line} onPress={()=>navigation.navigate("Offers")}>
        <MaterialIcons name="stars" size={24} color="black" />
        <Text style={styles.text}>Restaurant Rewards </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.line} onPress={()=>navigation.navigate("Wallet")}>
        <Entypo name="wallet" size={24} color="black" />
        <Text style={styles.text}>Wallet</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
container: {
  flex: 1,
 marginHorizontal: 15,
 },

 line: {
  flexDirection: "row",
  alignItems: "center",
  marginVertical: 20,

},
 text:{
  marginLeft: 20,
  fontSize: 20
}

})