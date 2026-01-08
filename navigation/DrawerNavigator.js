import React from 'react'
import {createDrawerNavigator} from '@react-navigation/drawer'
import BottomTabs from './BottomTabs'
import { Icon } from 'react-native-elements';
import BusinessConsoleScreen from '../screens/BusinessConsoleScreen';
import DrawerContent from '../components/DrawerContent';
import { SearchNavigator } from './Stacks';
import RestaurantsMapScreen from '../screens/RestaurantsMapScreen';
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import RestaurantDetail from '../screens/RestaurantDetail';
import Offers from '../screens/Offers'
import Settings from '../screens/Settings';


const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator  
    screenOptions={{headerShown: false }}
    drawerContent= {props => <DrawerContent {...props}/>}
    >
        <Drawer.Screen 
            name = "BottomTabs"
            component={BottomTabs}
            options={{
                title: "Restaurants",
                drawerIcon: ({focussed, size}) =>(
                  <Icon 
                    type="material-community"
                    name="home"
                    color={focussed ? "black":""}
                    size={size}
                  />  
                )
            }}
        />
         
        <Drawer.Screen 
            name = "Pickup"
             initialParams={{visible: false}}
            component={RestaurantsMapScreen}
            options={{
                title: "Pickup",
                drawerIcon: ({focussed, size}) =>(
                  <MaterialIcons 
                  name="takeout-dining"
                  color={focussed}
                  size={size}
              /> 
                )
            }}
        />
        <Drawer.Screen 
            name = "Search"
            component={SearchNavigator}
            options={{
                title: "Search",
                drawerIcon: ({focussed, size}) =>(
                  <Icon 
                    type="material"
                    name="search"
                    color={focussed ? "black":""}
                    size={size}
                  />  
                )
            }}
        />
         {/* <Drawer.Screen 
            name = "Settings"
            component={Settings}
            options={{
                title: "Settings",
                headerShown: true,
                drawerIcon: ({focussed, size}) =>(
                  <Ionicons 
                    name="settings"
                    color="black"
                    size={size}

                  />  
                )
            }}
        /> */}
    </Drawer.Navigator>
  )
}