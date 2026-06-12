import React from 'react'
import { Icon, withBadge} from 'react-native-elements'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { HomeNavigator, SearchNavigator, AccountNavigator, OrdersNavigator } from './Stacks'
import { CartNavigator } from './Stacks'
import { useSelector } from 'react-redux'
import { Ionicons, Feather } from '@expo/vector-icons'
import i18n from '../lang/i18n'
import { colors } from '../global'
const Tab = createBottomTabNavigator() 
export default function BottomTabs() {
  const cartCount = useSelector((state) => state.cartReducer.length)
  const BadgeIcon = withBadge(cartCount)(Icon)

  return (
       <Tab.Navigator
              screenOptions={{
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.grey[700],
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
         component={CartNavigator} 
         options ={{
           headerShown: false,
           tabBarIcon: ({ color, size }) => (
            <BadgeIcon
              type="material-community"
              name="cart"
              size={size}
              color={color}
            />
           )
         }}
         />
      <Tab.Screen
        name="Orders"
        component={OrdersNavigator}
        options={{
          headerShown: false,
          title: i18n.t('drawer.orderHistory'),
          tabBarIcon: ({ color, size }) => (
            <Feather name="clock" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountNavigator}
        options={{
          headerShown: false,
          title: i18n.t('drawer.account'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
       </Tab.Navigator>
  )
}
