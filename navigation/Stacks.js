import { View, Text } from 'react-native'
import React from 'react'
import {createStackNavigator} from '@react-navigation/stack'
import Home from '../screens/Home'
import RestaurantDetail from '../screens/RestaurantDetail'
import MenuDetailScreen from '../screens/MenuDetailScreen'
import MyOrdersScreen from '../screens/MyOrdersScreen'
import OrderDetails from '../screens/OrderDetails'
import PreferenceScreen from '../components/PreferenceScreen'
import SearchResults from '../screens/SearchResults'
import CategoryResults from '../screens/CategoryResults'
import SearchScreen from '../screens/SearchScreen'
import OrdersScreen from '../screens/OrdersScreen'
import OrderTracking from '../screens/OrderTracking'
import OrderRequest from '../screens/OrderRequest'
import CartScreen from '../screens/CartScreen'
import RestaurantsMapScreen from '../screens/RestaurantsMapScreen'
import RestaurantSearchResults from '../screens/RestaurantSearchResults'
import AccountScreen from '../screens/AccountScreen'
import EditProfileScreen from '../screens/EditProfileScreen'
import { CategoriesContextProvider } from '../contexts/CategoriesContext'

const  HomeStack = createStackNavigator()

export function HomeNavigator() {
  return (
    // <CategoriesContextProvider> 
      <HomeStack.Navigator>
        <HomeStack.Screen 
          name="HomeScreen"
          component={Home}
          options={{headerShown: false}}/>

      <HomeStack.Screen 
          name="RestaurantSearchResults"
          component={RestaurantSearchResults}
          options={{headerShown: false}}/>

        <HomeStack.Screen
          name="RestaurantDetail"
          component={RestaurantDetail}
          options={{ headerShown: false }} />
      

      <HomeStack.Screen 
          name="MenuDetailScreen"
          component={MenuDetailScreen}
          options={{headerShown: false}}/>

      <HomeStack.Screen 
          name="PreferenceScreen"
          component={PreferenceScreen}
          options={{headerShown: false}}/>

<HomeStack.Screen 
          name="RestaurantsMapScreen"
          component={RestaurantsMapScreen}
          options={{headerShown: false}}/>


{/* <HomeStack.Screen 
          name="SearchResults"
          component={SearchResults}
          options={{headerShown: true}}/> */}

      </HomeStack.Navigator>
      // </CategoriesContextProvider>
      
  )
}

const  OrderStack = createStackNavigator()

export function OrderNavigator() {

  return (
    <OrderStack.Navigator>
       <OrderStack.Screen 
          name="Carts"
          component={CartScreen}
          options={{headerShown: true, headerLeft: null}}/>

       <OrderStack.Screen 
          name="OrderDetails"
          component={OrderDetails}
          options={{headerShown: false}}/>

       <OrderStack.Screen 
          name="OrderTracking"
          component={OrderTracking}
          options={{headerShown: true}}/>

       <OrderStack.Screen 
          name="Orders"
          component={OrdersScreen}
          options={{}}/>

    </OrderStack.Navigator>
  )

}

const AccountStack = createStackNavigator()

export function AccountNavigator() {
  return (
    <AccountStack.Navigator>
      <AccountStack.Screen
        name="AccountScreen"
        component={AccountScreen}
        options={{ headerShown: false }}
      />

      <AccountStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
          headerShown: true
        }}
      />
    </AccountStack.Navigator>
  )
}

const  SearchStack = createStackNavigator()

export function SearchNavigator() {

  return (
    <SearchStack.Navigator>
       <SearchStack.Screen 
          name="SearchScreen"
          component={SearchScreen}
          options={{headerShown: false}}/>

       <SearchStack.Screen
          name="SearchResults"
          component={SearchResults}
          options={{}}/>

       {/* <SearchStack.Screen
          name="CategoryResults"
          component={CategoryResults}
          options={{}}/> */}

    </SearchStack.Navigator>
  )

}