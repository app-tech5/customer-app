import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import Home from '../screens/Home'
import RestaurantDetail from '../screens/RestaurantDetail'
import MenuDetailScreen from '../screens/MenuDetailScreen'
import OrderDetails from '../screens/OrderDetails'
import SearchScreen from '../screens/SearchScreen'
import OrdersScreen from '../screens/OrdersScreen'
import OrderTracking from '../screens/OrderTracking'
import CartScreen from '../screens/CartScreen'
import CartDetailsScreen from '../screens/CartDetailsScreen'
import RestaurantsMapScreen from '../screens/RestaurantsMapScreen'
import RestaurantSearchResults from '../screens/RestaurantSearchResults'
import AccountScreen from '../screens/AccountScreen'
import EditProfileScreen from '../screens/EditProfileScreen'
import AddressesScreen from '../screens/AddressesScreen'
import CheckoutScreen from '../screens/CheckoutScreen'

const HomeStack = createStackNavigator()

export function HomeNavigator() {
  return (

    <HomeStack.Navigator>
      <HomeStack.Screen
        name="HomeScreen"
        component={Home}
        options={{ headerShown: false }} />

      <HomeStack.Screen
        name="RestaurantSearchResults"
        component={RestaurantSearchResults}
        options={{ headerShown: false }} />

      <HomeStack.Screen
        name="RestaurantDetail"
        component={RestaurantDetail}
        options={{ headerShown: false }} />

      <HomeStack.Screen
        name="MenuDetailScreen"
        component={MenuDetailScreen}
        options={{ headerShown: false }} />

      <HomeStack.Screen
        name="CartDetails"
        component={CartDetailsScreen}
        options={{
          title: 'Détails du panier',
          headerShown: true
        }} />

      <HomeStack.Screen
        name="RestaurantsMapScreen"
        component={RestaurantsMapScreen}
        options={{ headerShown: false }} />



    </HomeStack.Navigator>

  )
}

const OrderStack = createStackNavigator()

export function OrderNavigator() {

  return (
    <OrderStack.Navigator>
      <OrderStack.Screen
        name="Carts"
        component={CartScreen}
        options={{ headerShown: true, headerLeft: null }} />

      <OrderStack.Screen
        name="OrderDetails"
        component={OrderDetails}
        options={{ headerShown: false }} />

      <OrderStack.Screen
        name="OrderTracking"
        component={OrderTracking}
        options={{ headerShown: true }} />

      <OrderStack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{}} />

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
        options={{ headerShown: true }}
      />

      <AccountStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
          headerShown: true
        }}
      />

      <AccountStack.Screen
        name="AddressesScreen"
        component={AddressesScreen}
        options={{
          title: 'Addresses',
          headerShown: true
        }}
      />

      <AccountStack.Screen
        name="CheckoutScreen"
        component={CheckoutScreen}
        options={{
          title: 'Checkout',
          headerShown: true
        }}
      />
    </AccountStack.Navigator>
  )
}

const SearchStack = createStackNavigator()

export function SearchNavigator() {

  return (
    <SearchStack.Navigator>
      <SearchStack.Screen
        name="SearchScreen"
        component={SearchScreen}
        options={{ headerShown: false }} />
    </SearchStack.Navigator>
  )

}
