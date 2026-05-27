import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useState, useEffect, useContext } from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import { api } from '../api'
import { config } from '../config'
import i18n from '../lang/i18n'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import * as Animatable from "react-native-animatable"
import { useDispatch } from 'react-redux'
import Loader from './Loader'
import { saveSignInData, getSignInData } from '../utils/cacheUtils'
import { SignInContext } from '../contexts/authContext'

export default function SignIn({ navigation }) {

  const [email, setEmail] = useState(config.DEMO_MODE ? config.DEMO_EMAIL : '')
  const [password, setPassword] = useState(config.DEMO_MODE ? config.DEMO_PASSWORD : '')
  const [showPassword, setShowPassword] = useState(false)
  const dispatch = useDispatch();
  const [loginState, setLoginState] = useState(false)
  const { setSignedIn } = useContext(SignInContext)
  
  useEffect(() => {
    const loadSavedEmail = async () => {
      const savedData = await getSignInData();
      if (savedData && savedData.email && !config.DEMO_MODE) {
        setEmail(savedData.email.trim());
      }
    };
    loadSavedEmail();
  }, [])

  const SignInUser = async () => {

    setLoginState(true)

    try {
      const normalizedEmail = email.trim()
      const result = await api.login(normalizedEmail, password)
      
      await AsyncStorage.setItem('userToken', result.token)
      
      const userInfo = await api.getUserInfo(result.user.id)

      dispatch({
        type: 'ADD_USER',
        payload: {
          ...userInfo,
          userId: result.user.id
        }
      });
      
      await AsyncStorage.setItem('userData', JSON.stringify(userInfo))
      
      await saveSignInData(normalizedEmail, true);
      
      setSignedIn(result.token)

      // navigation.navigate('DrawerNavigator')

    } catch (e) {
      console.error(e)
      setLoginState(false)
    }

  }

  loginState && setTimeout(() => {
    setLoginState(false)
  }, 10000)

  if (loginState)
    return <Loader />

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{i18n.t('auth.welcome')}</Text>
        {config.DEMO_MODE && (
          <Text style={styles.demoText}>{i18n.t('auth.demoMode')}</Text>
        )}
      </View>

      <Animatable.View style={styles.footer} animation="fadeInUpBig">

        <View style={styles.textInputContainer}>
          <MaterialIcons name="person" size={20} color="#3d5c5c" style={{
            marginLeft: 6,
          }} />
          <TextInput
            placeholder={i18n.t('auth.email')}
            value={email}
            onChangeText={(text) => setEmail(text)}
            style={styles.textInput} />

        </View>

        <View style={styles.textInputContainer}>
          <MaterialIcons name="lock" size={20} color="#3d5c5c" style={{
            marginLeft: 6,
          }} />
          <TextInput
            placeholder={i18n.t('auth.password')}
            value={password}
            onChangeText={(text) => setPassword(text)}
            style={[styles.textInput, styles.textInputFlex]}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <MaterialIcons
              name={showPassword ? 'visibility-off' : 'visibility'}
              size={20}
              color="#3d5c5c"
            />
          </TouchableOpacity>

        </View>

        <TouchableOpacity onPress={() => SignInUser()}>

          <LinearGradient
            colors={['#948E99', '#2E1437']}
            style={styles.signInButton} >
            <Text style={{ ...styles.signInText, color: 'white' }}>{i18n.t('auth.signIn')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>

          <LinearGradient
            colors={['#ada996', '#f2f2f2', '#dbdbdb', '#eaeaea']}
            style={styles.signInButton} >
            <Text style={styles.signInText}>{i18n.t('auth.signUp')}</Text>
          </LinearGradient>

        </TouchableOpacity>

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
  demoText: {
    fontSize: 12,
    color: "#ff6b35",
    fontWeight: "600",
    marginTop: 5,
    textAlign: "center"
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
  textInputFlex: {
    flex: 1,
    width: undefined,
  },
  eyeButton: {
    padding: 10,
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

})