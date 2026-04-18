import React, { useState } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { NavigationContainer } from '@react-navigation/native'
import { Provider as ReduxProvider } from 'react-redux'
import configureStore from '../redux/store'
import OrderCompleted from '../screens/OrderCompleted'
import DrawerNavigator from './DrawerNavigator'
import Splash from '../screens/Splash'
import SignIn from '../screens/SignIn'
import OnboardingScreen from '../screens/Onboarding'
import SignUp from '../screens/SignUp'
import { LoaderContext } from '../contexts/LoaderContext'
import { RestaurantsContext } from '../contexts/RestaurantsContext'
import { CategoriesContextProvider } from '../contexts/CategoriesContext'
import { DeliverySettingsProvider } from '../contexts/DeliverySettingsContext'
import { SettingProvider } from '../contexts/SettingContext'
import { GatewayProvider } from '../contexts/GatewayContext'
import { PaymentMethodsProvider } from '../contexts/PaymentMethodsContext'
import { StripeProvider } from '@stripe/stripe-react-native'
import CategoryResults from '../screens/CategoryResults'
import ItemResults from '../screens/ItemResults'
import {
  SearchNavigator,
  WalletFlowNavigator,
  CheckoutNavigator,
  OrderStatusNavigator,
} from './Stacks'
import { SignInContextProvider } from '../contexts/authContext'
import { useGateway } from '../contexts/GatewayContext'
import { config } from '../config'
import { OrdersProvider } from '../contexts/OrdersContext'

const FALLBACK_STRIPE_PUBLISHABLE_KEY = config.FALLBACK_STRIPE_PUBLISHABLE_KEY

function StripeWrappedNavigation({ children }) {
  const { stripePublishableKey } = useGateway()
  return (
    <StripeProvider
      publishableKey={stripePublishableKey || FALLBACK_STRIPE_PUBLISHABLE_KEY}
      urlScheme="goodfoods"
    >
      {children}
    </StripeProvider>
  )
}

const store = configureStore();
export default function RootNavigation({ statusBarColor }) {
  const Stack = createStackNavigator();
  const [loading, setLoading] = useState(false)
  const [restaurantData, setRestaurantData] = useState()
  const screenOptions = {
    headerShown: false,
  }
  return (
    <SignInContextProvider>
      <ReduxProvider store={store}>
        <NavigationContainer>
          <LoaderContext.Provider value={{ loading, setLoading }}>
            <SettingProvider>
              <GatewayProvider>
                <StripeWrappedNavigation>
                  <PaymentMethodsProvider>
                    <DeliverySettingsProvider>
                      <RestaurantsContext.Provider value={{ restaurantData, setRestaurantData }}>
                        <OrdersProvider>
                          <CategoriesContextProvider>
                            <Stack.Navigator screenOptions={screenOptions}>
                              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                              <Stack.Screen name="Splash" component={Splash} />
                              <Stack.Screen name="SignIn" component={SignIn} />
                              <Stack.Screen name="SignUp" component={SignUp} />
                              <Stack.Screen name="DrawerNavigator" component={DrawerNavigator} />
                              <Stack.Screen name="OrderCompleted" component={OrderCompleted} />
                              <Stack.Screen name="SearchFlow" component={SearchNavigator} options={{ headerShown: false }} />
                              <Stack.Screen name="WalletFlow" component={WalletFlowNavigator} options={{ headerShown: false }} />
                              <Stack.Screen name="CheckoutFlow" component={CheckoutNavigator} options={{ headerShown: false }} />
                              <Stack.Screen name="OrderStatusFlow" component={OrderStatusNavigator} options={{ headerShown: false }} />
                              <Stack.Screen name="CategoryResults" component={CategoryResults} options={{ headerShown: true }} />
                              <Stack.Screen name="ItemResults" component={ItemResults} options={{ headerShown: true }} />
                              { }
                            </Stack.Navigator>
                          </CategoriesContextProvider>
                        </OrdersProvider>
                      </RestaurantsContext.Provider>
                    </DeliverySettingsProvider>
                  </PaymentMethodsProvider>
                </StripeWrappedNavigation>
              </GatewayProvider>
            </SettingProvider>
          </LoaderContext.Provider>
        </NavigationContainer>
      </ReduxProvider>
    </SignInContextProvider>
  )
}