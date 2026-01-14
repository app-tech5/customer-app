import React from 'react'
import {createDrawerNavigator} from '@react-navigation/drawer'
import BottomTabs from './BottomTabs'
import BusinessConsoleScreen from '../screens/BusinessConsoleScreen';
import DrawerContent from '../components/DrawerContent';
import { SearchNavigator } from './Stacks';
import RestaurantsMapScreen from '../screens/RestaurantsMapScreen';
import Offers from '../screens/Offers'
import Settings from '../screens/Settings';
import AccountScreen from '../screens/AccountScreen';
import Wallet from '../screens/Wallet';
import OrdersScreen from '../screens/OrdersScreen';
import MyOrdersScreen from '../screens/MyOrdersScreen';
import { Ionicons, MaterialIcons, FontAwesome, Entypo, AntDesign, Feather } from '@expo/vector-icons'
import i18n from '../i18n';
import { colors } from '../global';


const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
    screenOptions={{
        headerShown: false,
        drawerStyle: {
            backgroundColor: '#ffffff',
            width: 280,
        },
        drawerLabelStyle: {
            fontSize: 16,
            fontWeight: '500',
            marginLeft: 8,
        },
        drawerItemStyle: {
            marginVertical: 2,
            marginHorizontal: 8,
            borderRadius: 8,
        },
        drawerActiveTintColor: colors.primary, // Couleur primaire originale
        drawerInactiveTintColor: colors.grey[700], // Gris cohérent
        drawerActiveBackgroundColor: 'rgba(0, 0, 0, 0.08)', // Fond actif noir subtil
        drawerInactiveBackgroundColor: 'transparent', // Fond inactif transparent
    }}
    drawerContent= {props => <DrawerContent {...props}/>}
    >
        {/* 🍽️ ACCUEIL & NAVIGATION */}
        <Drawer.Screen
            name = "BottomTabs"
            component={BottomTabs}
            options={{
                title: i18n.t('drawer.home'),
                drawerIcon: ({focused, size}) => (
                    <Ionicons
                        name="home-outline"
                        color={focused ? colors.primary : colors.grey[700]}
                        size={size}
                    />
                )
            }}
        />

        <Drawer.Screen
            name = "Search"
            component={SearchNavigator}
            options={{
                title: i18n.t('drawer.search'),
                drawerIcon: ({focused, size}) => (
                    <Ionicons
                        name="search"
                        color={focused ? colors.primary : colors.grey[700]}
                        size={size}
                    />
                )
            }}
        />

        <Drawer.Screen
            name = "Map"
            component={RestaurantsMapScreen}
            options={{
                title: i18n.t('drawer.map'),
                drawerIcon: ({focused, size}) => (
                    <FontAwesome
                        name="map-marker"
                        color={focused ? colors.primary : colors.grey[700]}
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
                title: i18n.t('drawer.offers'),
                drawerIcon: ({focused, size}) => (
                    <MaterialIcons
                        name="local-offer"
                        color={focused ? colors.primary : colors.grey[700]}
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
                title: i18n.t('drawer.myOrders'),
                drawerIcon: ({focused, size}) => (
                    <Ionicons
                        name="receipt"
                        color={focused ? colors.primary : colors.grey[700]}
                        size={size}
                    />
                )
            }}
        />

        <Drawer.Screen
            name = "Orders"
            component={OrdersScreen}
            options={{
                title: i18n.t('drawer.orderHistory'),
                drawerIcon: ({focused, size}) => (
                    <Feather
                        name="clock"
                        color={focused ? colors.primary : colors.grey[700]}
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
                title: i18n.t('drawer.account'),
                drawerIcon: ({focused, size}) => (
                    <Ionicons
                        name="person-circle-outline"
                        color={focused ? colors.primary : colors.grey[700]}
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
                title: i18n.t('drawer.wallet'),
                drawerIcon: ({focused, size}) => (
                    <Entypo
                        name="wallet"
                        color={focused ? colors.primary : colors.grey[700]}
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
                title: i18n.t('drawer.favorites'),
                drawerIcon: ({focused, size}) => (
                    <AntDesign
                        name="heart"
                        color={focused ? colors.primary : colors.grey[700]}
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
                title: i18n.t('drawer.notifications'),
                drawerIcon: ({focused, size}) => (
                    <Ionicons
                        name="notifications-outline"
                        color={focused ? colors.primary : colors.grey[700]}
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
                title: i18n.t('drawer.settings'),
                drawerIcon: ({focused, size}) => (
                    <Ionicons
                        name="settings-outline"
                        color={focused ? colors.primary : colors.grey[700]}
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
                title: i18n.t('drawer.business'),
                drawerIcon: ({focused, size}) => (
                    <MaterialIcons
                        name="business-center"
                        color={focused ? colors.primary : colors.grey[700]}
                        size={size}
                    />
                )
            }}
        />
    </Drawer.Navigator>
  )
}