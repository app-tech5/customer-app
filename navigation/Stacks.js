import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import Home from '../screens/Home'
import RestaurantDetail from '../screens/RestaurantDetail'
import MenuDetailScreen from '../screens/MenuDetailScreen'
import OrderDetails from '../screens/OrderDetails'
import SearchResults from '../screens/SearchResults'
import SearchScreen from '../screens/SearchScreen'
import OrdersScreen from '../screens/OrdersScreen'
import OrderTracking from '../screens/OrderTracking'
import OrderRequest from '../screens/OrderRequest'
import CartScreen from '../screens/CartScreen'
import CartDetailsScreen from '../screens/CartDetailsScreen'
import RestaurantsMapScreen from '../screens/RestaurantsMapScreen'
import RestaurantSearchResults from '../screens/RestaurantSearchResults'
import AccountScreen from '../screens/AccountScreen'
import EditProfileScreen from '../screens/EditProfileScreen'
import AddressesScreen from '../screens/AddressesScreen'
import CheckoutScreen from '../screens/CheckoutScreen'
import Wallet from '../screens/Wallet'
import AddPaymentMethodScreen from '../screens/AddPaymentMethodScreen'
import AddCard from '../screens/AddCard'
import Settings from '../screens/Settings'

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

const CartStack = createStackNavigator()

export function CartNavigator() {
  return (
    <CartStack.Navigator>
      <CartStack.Screen
        name="Carts"
        component={CartScreen}
        options={{ headerShown: true, headerLeft: null }} />

      <CartStack.Screen
        name="OrderDetails"
        component={OrderDetails}
        options={{ headerShown: false }} />

      <CartStack.Screen
        name="OrderTracking"
        component={OrderTracking}
        options={{ headerShown: true }} />

    </CartStack.Navigator>
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
        name="Settings"
        component={Settings}
        options={{
          title: 'Settings',
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
      <SearchStack.Screen
        name="SearchResults"
        component={SearchResults}
        options={{}} />
    </SearchStack.Navigator>
  )

}

const WalletStack = createStackNavigator()

export function WalletNavigator() {
  return (
    <WalletStack.Navigator>
      <WalletStack.Screen
        name="Wallet"
        component={Wallet}
        options={{ headerShown: true }}
      />
      <WalletStack.Screen
        name="AddPaymentMethod"
        component={AddPaymentMethodScreen}
        options={{ headerShown: true }}
      />
      <WalletStack.Screen
        name="AddCard"
        component={AddCard}
        options={{ headerShown: true }}
      />
    </WalletStack.Navigator>
  )
}

const CheckoutStack = createStackNavigator()

export function CheckoutNavigator() {
  return (
    <CheckoutStack.Navigator>
      <CheckoutStack.Screen
        name="CheckoutScreen"
        component={CheckoutScreen}
        options={{
          title: 'Checkout',
          headerShown: true
        }}
      />
      <CheckoutStack.Screen
        name="OrderRequest"
        component={OrderRequest}
        options={{
          title: 'Confirm Order',
          headerShown: true
        }}
      />
    </CheckoutStack.Navigator>
  )
}

const OrdersStack = createStackNavigator()

export function OrdersNavigator() {
  return (
    <OrdersStack.Navigator initialRouteName="Orders">
      <OrdersStack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{}}
      />
      <OrdersStack.Screen
        name="OrderDetails"
        component={OrderDetails}
        options={{ headerShown: false }}
      />
      <OrdersStack.Screen
        name="OrderTracking"
        component={OrderTracking}
        options={{ headerShown: true }}
      />
    </OrdersStack.Navigator>
  )
}

const OrderStatusStack = createStackNavigator()

export function OrderStatusNavigator() {
  return (
    <OrderStatusStack.Navigator>
      <OrderStatusStack.Screen
        name="OrderDetails"
        component={OrderDetails}
        options={{ headerShown: false }}
      />
      <OrderStatusStack.Screen
        name="OrderTracking"
        component={OrderTracking}
        options={{ headerShown: true }}
      />
    </OrderStatusStack.Navigator>
  )
}
