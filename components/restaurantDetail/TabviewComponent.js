import { View, Text, useWindowDimensions} from 'react-native'
import React, { useState } from 'react'
import {TabBar, TabView, SceneMap} from 'react-native-tab-view'

const FirstRoute = ()=>(
    <View style={{flex: 1, backgroundColor: "red"}}></View>
)

const SecondRoute = ()=>(
  <View style={{flex: 1, backgroundColor: "black"}}></View>
)

const renderScene = SceneMap({
    first: FirstRoute,
    second: SecondRoute
})

export default function TabviewComponent() {
    const layout =  useWindowDimensions()
    const [index, setIndex] = useState(0)
    const [routes]= useState([
        { key: 'first', title: 'First'},
        {key: 'second', title: 'Second'}
    ])
  return (
    <View>
      <TabView 
        navigationState={{index, routes}}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{width: layout.width}}/>
    </View>
  )
}