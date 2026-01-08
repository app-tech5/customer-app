import {
  View, Text, StatusBar, FlatList,
  ImageBackground, StyleSheet, Dimensions, TouchableOpacity
} from 'react-native'
import React, { useState } from 'react'
import SearchComponent from '../components/SearchComponent'
import { SafeAreaView } from 'react-native-safe-area-context'
import { categories, dataTest, filterData } from '../data'
import List from '../components/List'
import { Menu } from '../components/home/HomeHeader'
const SCREEN_WIDTH = Dimensions.get('window').width

export default function SearchScreen({ navigation }) {
  const [clicked, setCLicked] = useState(false)
  const [searchPhrase, setSearchPhrase] = useState("")
  const data = categories
  return (
    <SafeAreaView style={{
      flex: 1,
    }}>
      <View style={styles.header}>
        <Menu navigation={navigation} />
        <SearchComponent
          searchPhrase={searchPhrase}
          setSearchPhrase={setSearchPhrase}
          clicked={clicked}
          setCLicked={setCLicked}
        />
      </View>
      {clicked ? (<List
        searchPhrase={searchPhrase}
        data={data}
        setCLicked={setCLicked}
      />) : <></>}
      <View style={{ alignItems: "center", flex: 1 }}>
        <FlatList
          data={categories}
          keyExtractor={(item, index) => String(index)}
          renderItem={({ item }) => {
            return (
              <TouchableOpacity
                onPress={() => navigation.navigate("SearchResults", { name: item.name })} >
                <View style={styles.imageView}>
                  <ImageBackground
                    style={styles.image}
                    imageStyle={{ borderRadius: 20 }}
                    source={{ uri: item.image }}
                  >
                    <View style={styles.textView}>
                      <Text style={{
                        color: "white",
                        fontWeight: "bold"
                      }}>{item.name}</Text>
                    </View>
                  </ImageBackground>
                </View>
              </TouchableOpacity>
            )
          }}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          key={2} />
      </View>
    </SafeAreaView>
  )
}
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10
  },
  imageView: {
    alignItems: "center",
    justifyContent: "center",
    margin: 5,
  },
  image: {
    width: SCREEN_WIDTH * 0.4475,
    height: SCREEN_WIDTH * 0.3475,
    justifyContent: "flex-end"
  },
  textView: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
    height: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  }
})