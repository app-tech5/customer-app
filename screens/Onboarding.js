import { View, Text, ImageBackground, StyleSheet, TouchableOpacity} from 'react-native'
import React from 'react'
import * as Animatable from "react-native-animatable"
import i18n from '../lang/i18n'

export default function OnboardingScreen({navigation}) {
  return (
    <ImageBackground style={{ width: "100%", height: "100%" }}
      source={require("../assets/images/onboarding.jpg")}>
      <Text style={styles.title}>{i18n.t('onboarding.title')}</Text>
      <Animatable.View style={styles.footer} animation="fadeInUpBig">
      <View style={styles.box}>
        <Text style={styles.discoverText}>{i18n.t('onboarding.discover')}</Text>
        <TouchableOpacity style={styles.button} onPress={()=>{
          navigation.navigate("SignIn")
        }}>
          <Text style={styles.buttonText}>{i18n.t('onboarding.continue')}</Text>
        </TouchableOpacity>
      </View>
      </Animatable.View>
    </ImageBackground>
  )
}
const styles = StyleSheet.create({
  title: {
    color: "white",
    fontSize: 50,
    fontWeight: "bold",
    marginHorizontal: 40,
    marginTop: 40,
    flex: 1
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 50
  },
  box: {
    backgroundColor: "white",
  },
  button: {
    backgroundColor: "black",
    marginHorizontal: 10,
    marginBottom: 10
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    paddingVertical: 18,
    fontSize: 20
  },
  discoverText: {
    fontSize: 25,
    fontFamily: 'Roboto_500Medium',
    marginLeft: 15,
    paddingVertical: 20
  }
})