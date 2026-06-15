import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Home from '../screens/Home'
import RestaurantDetail from '../screens/RestaurantDetail'
import MenuDetailScreen from '../screens/MenuDetailScreen'
import OrderDetails from '../screens/OrderDetails'
import SearchResults from '../screens/SearchResults'
import SearchScreen from '../screens/SearchScreen'
import CategoryResults from '../screens/CategoryResults'
import ItemResults from '../screens/ItemResults'
import OrdersScreen from '../screens/OrdersScreen'
import OrderTracking from '../screens/OrderTracking'
import OrderRequest from '../screens/OrderRequest'
import CartScreen from '../screens/CartScreen'
import CartDetailsScreen from '../screens/CartDetailsScreen'
import RestaurantsMapScreen from '../screens/RestaurantsMapScreen'
import RestaurantSearchResults from '../screens/RestaurantSearchResults'
import AccountScreen from '../screens/AccountScreen'
import EditProfileScreen from '../screens/EditProfileScreen'
import FavoritesScreen from '../screens/FavoritesScreen'
import AddressesScreen from '../screens/AddressesScreen'
import EditAddressScreen from '../screens/EditAddressScreen'
import HelpSupportScreen from '../screens/HelpSupportScreen'
import AboutScreen from '../screens/AboutScreen'
import CheckoutScreen from '../screens/CheckoutScreen'
import Wallet from '../screens/Wallet'
import AddPaymentMethodScreen from '../screens/AddPaymentMethodScreen'
import AddCard from '../screens/AddCard'
import AddMoneyScreen from '../screens/AddMoneyScreen'
import Settings from '../screens/Settings'
import { colors } from '../global'

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
        options={{ headerShown: true }}
      />
        
      <CartStack.Screen
        name="CartDetails"
        component={CartDetailsScreen}
        options={{ headerShown: true }} />

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
        name="Favorites"
        component={FavoritesScreen}
        options={{ headerShown: true }}
      />

      <AccountStack.Screen
        name="RestaurantDetail"
        component={RestaurantDetail}
        options={{ headerShown: false }}
      />

      <AccountStack.Screen
        name="MenuDetailScreen"
        component={MenuDetailScreen}
        options={{ headerShown: false }}
      />

      <AccountStack.Screen
        name="CartDetails"
        component={CartDetailsScreen}
        options={{
          title: 'Détails du panier',
          headerShown: true,
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
        name="EditAddress"
        component={EditAddressScreen}
        options={{ headerShown: true }}
      />

      <AccountStack.Screen
        name="Settings"
        component={Settings}
        options={{
          title: 'Settings',
          headerShown: true
        }}
      />

      <AccountStack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{ headerShown: true }}
      />

      <AccountStack.Screen
        name="About"
        component={AboutScreen}
        options={{ headerShown: true }}
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
      <SearchStack.Screen
        name="RestaurantDetail"
        component={RestaurantDetail}
        options={{ headerShown: false }} />
      <SearchStack.Screen
        name="MenuDetailScreen"
        component={MenuDetailScreen}
        options={{ headerShown: false }} />
      <SearchStack.Screen
        name="CategoryResults"
        component={CategoryResults}
        options={{ headerShown: true }} />
      <SearchStack.Screen
        name="ItemResults"
        component={ItemResults}
        options={{ headerShown: true }} />
    </SearchStack.Navigator>
  )

}

const WalletStack = createStackNavigator()

export function WalletSectionNavigator({ navigation }) {
  return (
    <WalletStack.Navigator>
      <WalletStack.Screen
        name="Wallet"
        component={Wallet}
        options={{
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.toggleDrawer()}
              style={{ padding: 10, marginLeft: 5 }}
              accessibilityRole="button"
              accessibilityLabel="Open menu"
            >
              <Ionicons name="menu" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          ),
        }}
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
      <WalletStack.Screen
        name="AddMoney"
        component={AddMoneyScreen}
        options={{ headerShown: true }}
      />
    </WalletStack.Navigator>
  )
}

export function WalletFlowNavigator({ navigation }) {
  return (
    <WalletStack.Navigator>
      <WalletStack.Screen
        name="Wallet"
        component={Wallet}
        options={{
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ padding: 10, marginLeft: 5 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          ),
        }}
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
      <WalletStack.Screen
        name="AddMoney"
        component={AddMoneyScreen}
        options={{ headerShown: true }}
      />
    </WalletStack.Navigator>
  )
}

const CheckoutStack = createStackNavigator()

export function CheckoutNavigator({ navigation }) {
  return (
    <CheckoutStack.Navigator>
      <CheckoutStack.Screen
        name="CheckoutScreen"
        component={CheckoutScreen}
        options={{
          title: 'Checkout',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ padding: 10, marginLeft: 5 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          ),
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

export function OrderStatusNavigator({ navigation, route }) {
  const initialRouteName = route?.params?.screen === 'OrderTracking' ? 'OrderTracking' : 'OrderDetails'
  const initialParams = route?.params?.params

  return (
    <OrderStatusStack.Navigator initialRouteName={initialRouteName}>
      <OrderStatusStack.Screen
        name="OrderDetails"
        component={OrderDetails}
        initialParams={initialRouteName === 'OrderDetails' ? initialParams : undefined}
        options={{
          headerShown: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ padding: 10, marginLeft: 5 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <OrderStatusStack.Screen
        name="OrderTracking"
        component={OrderTracking}
        initialParams={initialRouteName === 'OrderTracking' ? initialParams : undefined}
        options={{
          headerShown: true,
          headerBackVisible: false,
          headerLeft: () => null,
        }}
      />
    </OrderStatusStack.Navigator>
  )
}

const SettingsStack = createStackNavigator()

export function SettingsSectionNavigator({ navigation }) {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen
        name="SettingsScreen"
        component={Settings}
        options={{
          title: 'Settings',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.toggleDrawer()}
              style={{ padding: 10, marginLeft: 5 }}
              accessibilityRole="button"
              accessibilityLabel="Open menu"
            >
              <Ionicons name="menu" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <SettingsStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
          headerShown: true,
        }}
      />
      <SettingsStack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{ headerShown: true }}
      />
      <SettingsStack.Screen
        name="About"
        component={AboutScreen}
        options={{ headerShown: true }}
      />
    </SettingsStack.Navigator>
  )
}
