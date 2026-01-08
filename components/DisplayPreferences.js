import { View, Text, StyleSheet} from 'react-native'
import React, { useState } from 'react'
import { menuDetailedData } from '../data'
import { CheckBox } from 'react-native-elements'
export default function DisplayPreferences() {
  return (
      <View style={styles.container}>
          {menuDetailedData[0].preferenceTitle.map((preft, index) => {
              return (
                  <View key={index}>
                      <Text style={styles.title}>{preft.toUpperCase()}</Text>
                    {menuDetailedData[0].preferenceData[index].map((prfd, i, tab)=>{
                            const [ptab, setPtab] = useState(tab)
                            return (
                                <CheckBox
                                key={i}
                                title={prfd.name}
                                checked={ptab[i].checked}
                                onPress={() => {
                                    tab[i].checked= true
                                }}
                            />
                            )
                    })}
                  </View>
              )
          })}
      </View>
  )
}
const styles = StyleSheet.create({
  container: {
    marginBottom : 20
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
})