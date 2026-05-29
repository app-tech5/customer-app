import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState } from 'react'
import { Entypo, MaterialIcons } from '@expo/vector-icons'
import { api } from '../api'
import { LinearGradient } from 'expo-linear-gradient'
import * as Animatable from "react-native-animatable"
import { useDispatch } from 'react-redux'

import SearchBar from '../components/home/SearchBar'
import i18n from '../lang/i18n'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { geocodeAddress } from '../utils/geocodeAddress'
import { saveSignInData } from '../utils/cacheUtils'
import Loader from './Loader'

export default function SignUp({ navigation }) {
  const insets = useSafeAreaInsets()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')

  const dispatch = useDispatch();
  const [loginState, setLoginState] = useState(false)

  const signUp = async () => {
    setLoginState(true)
    try {
      const normalizedEmail = email.trim()
      const normalizedName = name.trim()
      const normalizedPhone = phone.trim()
      const normalizedPassword = password.trim()
      const normalizedConfirmPassword = confirmPassword.trim()
      const normalizedAddress = typeof address === 'string' ? address.trim() : (address?.description || '').trim()
      const initialLat = Number(address?.location?.lat)
      const initialLng = Number(address?.location?.lng)
      let lat = Number.isFinite(initialLat) ? initialLat : 0
      let lng = Number.isFinite(initialLng) ? initialLng : 0

      if (!normalizedEmail || !normalizedName) {
        Alert.alert(i18n.t('common.error'), i18n.t('auth.emailRequired'))
        return
      }
      if (!normalizedPassword) {
        Alert.alert(i18n.t('common.error'), i18n.t('auth.passwordRequired'));
        return;
      }
      if (normalizedPassword !== normalizedConfirmPassword) {
        Alert.alert(i18n.t('common.error'), i18n.t('auth.passwordsDoNotMatch'));
        return;
      }

      if (!normalizedAddress) {
        Alert.alert(i18n.t('common.error'), i18n.t('auth.addressRequired'));
        return;
      }

      if ((!lat && !lng) && normalizedAddress) {
        const geocoded = await geocodeAddress(normalizedAddress)
        if (geocoded) {
          lat = geocoded.lat
          lng = geocoded.lng
        }
      }

      const userData = {
        email: normalizedEmail,
        password: normalizedPassword,
        name: normalizedName,
        phone: normalizedPhone,
        address: normalizedAddress,
        lat,
        lng,
        location: {
          latitude: lat,
          longitude: lng,
        },
      };

      await api.register(userData);
      await saveSignInData(normalizedEmail, true);
      console.warn("USER ACCOUNT CREATED");
      navigation.navigate("SignIn", { prefilledEmail: normalizedEmail });
    } catch (error) {
      console.error(error);
      Alert.alert(i18n.t('common.error'), i18n.t('auth.registerError'));
    } finally {
      setLoginState(false)
    }
  }

  if (loginState) {
    return <Loader />
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{i18n.t('auth.registerNow')}</Text>
      </View>

      <Animatable.View style={styles.footer} animation="fadeInUpBig">

        <View style={{ marginHorizontal: 25 }}>
          <SearchBar style={{ backgroundColor: "white", borderBottomColor: "grey", borderBottomWidth: 0.3 }}
            setAddress={setAddress} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 24, 40) }}
        >

          <View style={styles.textInputContainer}>
            <Entypo name="email" size={20} color="#3d5c5c" style={{
              marginLeft: 6,
            }} />
            <TextInput
              placeholder={i18n.t('auth.emailPlaceholder')}
              value={email}
              onChangeText={(text) => setEmail(text)}
              style={styles.textInput} />

          </View>

          <View style={styles.textInputContainer}>
            <MaterialIcons name="lock" size={20} color="#3d5c5c" style={{
              marginLeft: 6,
            }} />
            <TextInput
              placeholder={i18n.t('auth.passwordPlaceholder')}
              value={password}
              onChangeText={(text) => setPassword(text)}
              style={[styles.textInput, styles.textInputFlex]}
              secureTextEntry={!showPassword} />
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

          <View style={styles.textInputContainer}>
            <MaterialIcons name="lock" size={20} color="#3d5c5c" style={{
              marginLeft: 6,
            }} />
            <TextInput
              placeholder={i18n.t('auth.confirmPassword')}
              value={confirmPassword}
              onChangeText={(text) => setConfirmPassword(text)}
              style={[styles.textInput, styles.textInputFlex]}
              secureTextEntry={!showConfirmPassword} />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeButton}
            >
              <MaterialIcons
                name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                size={20}
                color="#3d5c5c"
              />
            </TouchableOpacity>

          </View>

          <View style={styles.textInputContainer}>
            <MaterialIcons name="person" size={20} color="#3d5c5c" style={{
              marginLeft: 6,
            }} />
            <TextInput
              placeholder={i18n.t('profile.name')}
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
              placeholder={i18n.t('profile.phone')}
              value={phone}
              onChangeText={(text) => setPhone(text)}
              style={styles.textInput}
            />

          </View>

          <TouchableOpacity onPress={() => { signUp() }}>

            <LinearGradient
              colors={['#948E99', '#2E1437']}
              style={styles.signInButton} >
              <Text style={{ ...styles.signInText, color: 'white' }}>{i18n.t('auth.signUp')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>

            <LinearGradient
              colors={['#ada996', '#f2f2f2', '#dbdbdb', '#eaeaea']}
              style={styles.signInButton} >
              <Text style={styles.signInText}>{i18n.t('auth.signIn')}</Text>
            </LinearGradient>

          </TouchableOpacity>
        </ScrollView>
      </Animatable.View>

    </KeyboardAvoidingView>

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
  signUpButton: {
    backgroundColor: "#0080ff",
    marginHorizontal: 25,
    borderRadius: 5,
    marginTop: 20,
    width: "100%"

  }
})