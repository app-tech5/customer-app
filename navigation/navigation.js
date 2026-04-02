import React, { useState } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { NavigationContainer } from '@react-navigation/native'
import { Provider as ReduxProvider } from 'react-redux'
import configureStore from '../redux/store'
import OrderCompleted from '../screens/OrderCompleted'
import DrawerNavigator from './DrawerNavigator'
import OrderRequest from '../screens/OrderRequest'
import Splash from '../screens/Splash'
import SignIn from '../screens/SignIn'
import Offers from '../screens/Offers'
import Wallet from '../screens/Wallet'
import AddPaymentMethodScreen from '../screens/AddPaymentMethodScreen'
import AddCard from '../screens/AddCard'
 import OnboardingScreen from '../screens/Onboarding'
import SignUp from '../screens/SignUp'
import { LoaderContext } from '../contexts/LoaderContext'
import { RestaurantsContext } from '../contexts/RestaurantsContext'
import Settings from '../screens/Settings'
import { CategoriesContextProvider } from '../contexts/CategoriesContext'
import { DeliverySettingsProvider } from '../contexts/DeliverySettingsContext'
import { SettingProvider } from '../contexts/SettingContext'
import CategoryResults from '../screens/CategoryResults'
import ItemResults from '../screens/ItemResults'
import SearchResults from '../screens/SearchResults'
import { SignInContextProvider } from '../contexts/authContext'
const store = configureStore();
export default function RootNavigation({statusBarColor}) {
    const Stack = createStackNavigator();
    const [loading, setLoading] = useState(false)
    const [restaurantData, setRestaurantData]= useState()
    const screenOptions = {
        headerShown: false,
    }
  return (
    <SignInContextProvider>
      <ReduxProvider store={store}>
        <NavigationContainer>
        <LoaderContext.Provider value={{loading, setLoading}}>
          <SettingProvider>
            <DeliverySettingsProvider>
              <RestaurantsContext.Provider value={{restaurantData, setRestaurantData}}>
                <CategoriesContextProvider> 
          <Stack.Navigator screenOptions={screenOptions}>
              <Stack.Screen name="Onboarding" component={OnboardingScreen}/>
              <Stack.Screen name="Splash" component={Splash}/>
              <Stack.Screen name="SignIn" component={SignIn}/>
              <Stack.Screen name="SignUp" component={SignUp}/>
              <Stack.Screen name="DrawerNavigator" component={DrawerNavigator}/>
              <Stack.Screen name="OrderRequest" component={OrderRequest}/>
              <Stack.Screen name="OrderCompleted" component={OrderCompleted}/>
              <Stack.Screen name="CategoryResults" component={CategoryResults} options={{ headerShown: true }} />
              <Stack.Screen name="ItemResults" component={ItemResults} options={{ headerShown: true }} />
              <Stack.Screen name="SearchResults" component={SearchResults} options={{ headerShown: true }} />
              <Stack.Screen name="Offers" component={Offers}/>
              <Stack.Screen name="Wallet" component={Wallet}/>
              <Stack.Screen
                name="AddPaymentMethod"
                component={AddPaymentMethodScreen}
                options={{ headerShown: true }}
              />
              <Stack.Screen name="AddCard" component={AddCard} options={{ headerShown: true }} />
              <Stack.Screen name="Settings" component={Settings}/>
              {}
          </Stack.Navigator>
              </CategoriesContextProvider>
            </RestaurantsContext.Provider>
          </DeliverySettingsProvider>
        </SettingProvider>
      </LoaderContext.Provider>
      </NavigationContainer>
    </ReduxProvider>
    </SignInContextProvider>
  )
}