import { View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList, StatusBar} from 'react-native'
import React, { useState } from 'react'
import { groupFoods } from '../data'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { grey1 } from '../global'

export default function GroupFoodHeader({foodsRef}) {
    const [focus, setFocus] = useState(new Array(groupFoods.length).fill(0))
  return (
      <View style={styles.container}>
          <FlatList
              showsHorizontalScrollIndicator={false}
              horizontal
              data={groupFoods}
              keyExtractor={(item, index) => index}
              renderItem={({ item, index}) => {
                  return <View style={{...styles.textContainer, borderBottomWidth: focus[index]}}>
                      <TouchableOpacity onPress={() => {
                           setFocus([...Array(index).fill(0),3,...Array(focus.length-index).fill(0)])
                          foodsRef.current.scrollToIndex({
                              animated: true,
                              index: index
                          })
                      }}>
                          <Text style={styles.text}>{item.name}</Text>
                      </TouchableOpacity>
                  </View>
              }}
          />
      </View>
  )
}
const styles = StyleSheet.create({
    container: {
     height: 60,
     borderBottomWidth: 3,
     borderBottomColor: grey1,
    },
    textContainer: {
        marginHorizontal: 20,
        justifyContent: "center"
    },
    text: {
        fontFamily: "Roboto_500Medium"
    }
})