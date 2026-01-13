import React from 'react'
import {createDrawerNavigator} from '@react-navigation/drawer'
import BottomTabs from './BottomTabs'
import { Icon } from 'react-native-elements';
import BusinessConsoleScreen from '../screens/BusinessConsoleScreen';
import DrawerContent from '../components/DrawerContent';
import { SearchNavigator } from './Stacks';
import RestaurantsMapScreen from '../screens/RestaurantsMapScreen';
import { Ionicons, MaterialIcons, FontAwesome, Entypo, AntDesign, Feather } from '@expo/vector-icons'
import Offers from '../screens/Offers'
import Settings from '../screens/Settings';
import AccountScreen from '../screens/AccountScreen';
import Wallet from '../screens/Wallet';
import OrdersScreen from '../screens/OrdersScreen';
import MyOrdersScreen from '../screens/MyOrdersScreen';


const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
    screenOptions={{headerShown: false }}
    drawerContent= {props => <DrawerContent {...props}/>}
    >
        {/* 🍽️ ACCUEIL & NAVIGATION */}
        <Drawer.Screen
            name = "BottomTabs"
            component={BottomTabs}
            options={{
                title: "🏠 Accueil",
                drawerIcon: ({focused, size}) =>(
                  <Icon
                    type="material-community"
                    name="home"
                    color={focused ? "black":"grey"}
                    size={size}
                  />
                )
            }}
        />

        <Drawer.Screen
            name = "Search"
            component={SearchNavigator}
            options={{
                title: "🔍 Recherche",
                drawerIcon: ({focused, size}) =>(
                  <Icon
                    type="material"
                    name="search"
                    color={focused ? "black":"grey"}
                    size={size}
                  />
                )
            }}
        />

        <Drawer.Screen
            name = "Map"
            component={RestaurantsMapScreen}
            options={{
                title: "🗺️ Carte des restaurants",
                drawerIcon: ({focused, size}) =>(
                  <FontAwesome
                    name="map-marker"
                    color={focused ? "black":"grey"}
                    size={size}
                  />
                )
            }}
        />

        {/* 🎯 OFFRES & PROMOTIONS */}
        <Drawer.Screen
            name = "Offers"
            component={Offers}
            options={{
                title: "🎯 Offres & Réductions",
                drawerIcon: ({focused, size}) =>(
                  <MaterialIcons
                    name="local-offer"
                    color={focused ? "black":"grey"}
                    size={size}
                  />
                )
            }}
        />

        {/* 📦 COMMANDES */}
        <Drawer.Screen
            name = "MyOrders"
            component={MyOrdersScreen}
            options={{
                title: "📦 Mes commandes",
                drawerIcon: ({focused, size}) =>(
                  <Ionicons
                    name="receipt"
                    color={focused ? "black":"grey"}
                    size={size}
                  />
                )
            }}
        />

        <Drawer.Screen
            name = "Orders"
            component={OrdersScreen}
            options={{
                title: "📋 Historique des commandes",
                drawerIcon: ({focused, size}) =>(
                  <Feather
                    name="clock"
                    color={focused ? "black":"grey"}
                    size={size}
                  />
                )
            }}
        />

        {/* 👤 COMPTE UTILISATEUR */}
        <Drawer.Screen
            name = "Account"
            component={AccountScreen}
            options={{
                title: "👤 Mon compte",
                drawerIcon: ({focused, size}) =>(
                  <Ionicons
                    name="person-circle-outline"
                    color={focused ? "black":"grey"}
                    size={size}
                  />
                )
            }}
        />

        {/* 💰 PORTEFEUILLE & PAIEMENTS */}
        <Drawer.Screen
            name = "Wallet"
            component={Wallet}
            options={{
                title: "💰 Portefeuille",
                drawerIcon: ({focused, size}) =>(
                  <Entypo
                    name="wallet"
                    color={focused ? "black":"grey"}
                    size={size}
                  />
                )
            }}
        />

        {/* ❤️ FAVORIS */}
        <Drawer.Screen
            name = "Favorites"
            component={AccountScreen} // Temporaire - à remplacer par écran favoris dédié
            options={{
                title: "❤️ Favoris",
                drawerIcon: ({focused, size}) =>(
                  <AntDesign
                    name="heart"
                    color={focused ? "black":"grey"}
                    size={size}
                  />
                )
            }}
        />

        {/* 🔔 NOTIFICATIONS */}
        <Drawer.Screen
            name = "Notifications"
            component={AccountScreen} // Temporaire - à remplacer par écran notifications
            options={{
                title: "🔔 Notifications",
                drawerIcon: ({focused, size}) =>(
                  <Ionicons
                    name="notifications-outline"
                    color={focused ? "black":"grey"}
                    size={size}
                  />
                )
            }}
        />

        {/* ⚙️ PARAMÈTRES */}
        <Drawer.Screen
            name = "Settings"
            component={Settings}
            options={{
                title: "⚙️ Paramètres",
                drawerIcon: ({focused, size}) =>(
                  <Ionicons
                    name="settings-outline"
                    color={focused ? "black":"grey"}
                    size={size}
                  />
                )
            }}
        />

        {/* 🏢 BUSINESS (optionnel) */}
        <Drawer.Screen
            name = "BusinessConsole"
            component={BusinessConsoleScreen}
            options={{
                title: "🏢 Business Console",
                drawerIcon: ({focused, size}) =>(
                  <MaterialIcons
                    name="business-center"
                    color={focused ? "black":"grey"}
                    size={size}
                  />
                )
            }}
        />
    </Drawer.Navigator>
  )
}