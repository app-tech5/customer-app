import { View, Text, StyleSheet, Image, TouchableOpacity} from 'react-native'
import React, {useEffect} from 'react'
import * as Animatable from "react-native-animatable"
import {LinearGradient} from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function Splash() {
  const navigation = useNavigation()

  return (
    <View style={styles.container}>
     <View style={styles.container1}>
         
       <Animatable.Image 
        animation="bounceIn"
        duraton="1500"
        source={require("../assets/images/goodFood.png")} 
       style={styles.image}/>
     </View>
     <Animatable.View style={styles.container2} animation="fadeInUpBig">
             
              <View style={styles.button}>
                  <TouchableOpacity onPress={()=>navigation.navigate("SignIn")}>
                      <LinearGradient
                          colors={['#ada996', '#f2f2f2', '#dbdbdb', '#eaeaea']}
                          style={styles.signInButton} >
                          <Text style={styles.signInText}>Get Started</Text>
                          <MaterialIcons name="navigate-next" size={20} color="black" />
                      </LinearGradient>
                  </TouchableOpacity>
              </View>
         
         
     </Animatable.View>
    </View>
  )
}

const styles = StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor: "#b3b3b3"
    },
    container1: {
      flex: 2,
      justifyContent: "center",
      alignItems: "center",
    },
    container2: {
      flex: 1,
      backgroundColor: "#fff",
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30
    },
    image: {
        width: 300,
        height: 300
    },
    signInText: {
        fontWeight: "bold",
        color: "#3d5c5c"
    },
    signInButton: {
        width: 150,
        height: 40,
        justifyContent: "space-around",
        alignItems: "center",
        borderRadius: 5,
        flexDirection: "row",
        
    },
    button: {
        alignItems:"flex-end",
        marginTop: 100,
        marginRight: 20,
    }
})