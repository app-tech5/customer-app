import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Icon, withBadge} from 'react-native-elements'
import Home from '../screens/Home'
import SignUp from '../screens/SignUp'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import SearchScreen from '../screens/SearchScreen'
import MyOrdersScreen from '../screens/MyOrdersScreen'
import AccountScreen from '../screens/AccountScreen'
import { HomeNavigator, SearchNavigator } from './Stacks'
import { OrderNavigator } from './Stacks'
import { useSelector } from 'react-redux'
import RestaurantsMapScreen from '../screens/RestaurantsMapScreen'
import { FontAwesome } from '@expo/vector-icons'
const Tab = createBottomTabNavigator() 
export default function BottomTabs() {
  const BadgeIcon = withBadge(useSelector((state)=>state.cartReducer).length)(Icon)
  return (
       <Tab.Navigator
              screenOptions={{
                tabBarActiveTintColor: "black",
              }}
           >
         <Tab.Screen 
         name = "Home" 
         component={HomeNavigator} 
         options ={{
           headerShown: false,
           tabBarIcon: ({color, size}) =>(
            <Icon 
            name="home" 
            type="material"
            color={color}
            size={size}/>
           ) 
         }}
         />
          <Tab.Screen 
         name = "Search" 
         component={SearchNavigator} 
         options ={{
           headerShown: false,
           tabBarIcon: ({color, size}) =>(
            <Icon 
            name="search" 
            type="material"
            color={color}
            size={size}/>
           ) 
         }}
         />
         <Tab.Screen 
        name = "Cart"
         component={OrderNavigator} 
         options ={{
           headerShown: false,
           tabBarIcon: ({color, size}) =>(
            <BadgeIcon
                type = "material-community"
                name = 'cart'
                size={size}
                color="black"
              />
           ) 
         }}
         />
      <Tab.Screen 
         name = "Map" 
         initialParams={{visible: true}}
          component={RestaurantsMapScreen} 
         options ={{
          headerShown: false,
           tabBarIcon: ({color, size}) =>(
            <FontAwesome 
            name="map-marker" 
            color={color}
            size={size}/>
           ) 
         }}
         />
       </Tab.Navigator>
  )
}
