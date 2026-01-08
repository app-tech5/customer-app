import { View, Text, SafeAreaView, StatusBar, Image, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Entypo, MaterialIcons } from '@expo/vector-icons'
import { addUser, auth } from '../firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { LinearGradient } from 'expo-linear-gradient'
import * as Animatable from "react-native-animatable"
import { useDispatch } from 'react-redux'

import AsyncStorage from '@react-native-async-storage/async-storage'
import Loader from './Loader'
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete'
import SearchBar from '../components/home/SearchBar'



export default function SignUp({ navigation }) {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')

  const dispatch = useDispatch();
  const [loginState, setLoginState] = useState(false)


  async function signUp() {

    try {
      const userCredentials = await createUserWithEmailAndPassword(auth, email, password)

      addUser(userCredentials, name, phone, address)
        .then(() => navigation.navigate("SignIn"))

      console.log("USER ACCOUNT CREATED")
    } catch (error) {
      console.log(error.code)

    }
  }



  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Register Now !</Text>
      </View>

      <Animatable.View style={styles.footer} animation="fadeInUpBig">

        <View style={{ marginHorizontal: 25 }}>
          <SearchBar style={{ backgroundColor: "white", borderBottomColor: "grey", borderBottomWidth: 0.3 }}
            setAddress={setAddress} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} >


          <View style={styles.textInputContainer}>
            <Entypo name="email" size={20} color="#3d5c5c" style={{
              marginLeft: 6,
            }} />
            <TextInput
              placeholder='Email'
              value={email}
              onChangeText={(text) => setEmail(text)}
              style={styles.textInput} />

          </View>

          <View style={styles.textInputContainer}>
            <MaterialIcons name="lock" size={20} color="#3d5c5c" style={{
              marginLeft: 6,
            }} />
            <TextInput
              placeholder='Password'
              value={password}
              onChangeText={(text) => setPassword(text)}
              style={styles.textInput}
              secureTextEntry />

          </View>

          <View style={styles.textInputContainer}>
            <MaterialIcons name="person" size={20} color="#3d5c5c" style={{
              marginLeft: 6,
            }} />
            <TextInput
              placeholder='Name'
              value={name}
              onChangeText={(text) => setName(text)}
              style={styles.textInput}
            />

          </View>

          <View style={styles.textInputContainer}>
            <Entypo name="phone" size={20} color="#3d5c5c" style={{
              marginLeft: 6,
            }} />
            <TextInput
              placeholder='Phone'
              value={phone}
              onChangeText={(text) => setPhone(text)}
              style={styles.textInput}
            />

          </View>

          <TouchableOpacity onPress={() => { signUp() }}>

            <LinearGradient
              colors={['#948E99', '#2E1437']}
              style={styles.signInButton} >
              <Text style={{ ...styles.signInText, color: 'white' }}>Sign Up</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>

            <LinearGradient
              colors={['#ada996', '#f2f2f2', '#dbdbdb', '#eaeaea']}
              style={styles.signInButton} >
              <Text style={styles.signInText}>Sign In</Text>
            </LinearGradient>

          </TouchableOpacity>
        </ScrollView>
      </Animatable.View>

    </View>


  )
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#b3b3b3"
  },

  header: {
    alignItems: "center",

    flex: 1,
    paddingBottom: 50,
    justifyContent: "flex-end"
  },
  title: {
    fontSize: 25, fontWeight: "bold", color: "#3d5c5c",
    letterSpacing: 5
  },
  footer: {
    flex: 3,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  textInputContainer: {
    flexDirection: "row",

    backgroundColor: "white",
    marginHorizontal: 25,

    borderRadius: 5,
    marginTop: 20,
    alignItems: "center",
    borderBottomWidth: 0.3,
    borderBottomColor: "grey"


  },
  textInput: {

    width: "90%",
    padding: 10
  },
  signInButton: {
    width: "100%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,

    marginTop: 50

  },
  signInText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3d5c5c",
    letterSpacing: 1
  },
  signUpButton: {
    backgroundColor: "#0080ff",
    marginHorizontal: 25,
    borderRadius: 5,
    marginTop: 20,
    width: "100%"

  }
})