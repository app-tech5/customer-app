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
import i18n from '../i18n';


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
            marginLeft: -16,
        },
        drawerActiveTintColor: '#FF6B35', // Couleur primaire
        drawerInactiveTintColor: '#43484d', // Texte secondaire
        drawerActiveBackgroundColor: 'rgba(255, 107, 53, 0.1)', // Fond actif subtil
    }}
    drawerContent= {props => <DrawerContent {...props}/>}
    >
        {/* 🍽️ ACCUEIL & NAVIGATION */}
        <Drawer.Screen
            name = "BottomTabs"
            component={BottomTabs}
            options={{
                title: i18n.t('drawer.home')
            }}
        />

        <Drawer.Screen
            name = "Search"
            component={SearchNavigator}
            options={{
                title: i18n.t('drawer.search')
            }}
        />

        <Drawer.Screen
            name = "Map"
            component={RestaurantsMapScreen}
            options={{
                title: i18n.t('drawer.map')
            }}
        />

        {/* 🎯 OFFRES & PROMOTIONS */}
        <Drawer.Screen
            name = "Offers"
            component={Offers}
            options={{
                title: i18n.t('drawer.offers')
            }}
        />

        {/* 📦 COMMANDES */}
        <Drawer.Screen
            name = "MyOrders"
            component={MyOrdersScreen}
            options={{
                title: i18n.t('drawer.myOrders')
            }}
        />

        <Drawer.Screen
            name = "Orders"
            component={OrdersScreen}
            options={{
                title: i18n.t('drawer.orderHistory')
            }}
        />

        {/* 👤 COMPTE UTILISATEUR */}
        <Drawer.Screen
            name = "Account"
            component={AccountScreen}
            options={{
                title: i18n.t('drawer.account')
            }}
        />

        {/* 💰 PORTEFEUILLE & PAIEMENTS */}
        <Drawer.Screen
            name = "Wallet"
            component={Wallet}
            options={{
                title: i18n.t('drawer.wallet')
            }}
        />

        {/* ❤️ FAVORIS */}
        <Drawer.Screen
            name = "Favorites"
            component={AccountScreen} // Temporaire - à remplacer par écran favoris dédié
            options={{
                title: i18n.t('drawer.favorites')
            }}
        />

        {/* 🔔 NOTIFICATIONS */}
        <Drawer.Screen
            name = "Notifications"
            component={AccountScreen} // Temporaire - à remplacer par écran notifications
            options={{
                title: i18n.t('drawer.notifications')
            }}
        />

        {/* ⚙️ PARAMÈTRES */}
        <Drawer.Screen
            name = "Settings"
            component={Settings}
            options={{
                title: i18n.t('drawer.settings')
            }}
        />

        {/* 🏢 BUSINESS (optionnel) */}
        <Drawer.Screen
            name = "BusinessConsole"
            component={BusinessConsoleScreen}
            options={{
                title: i18n.t('drawer.business')
            }}
        />
    </Drawer.Navigator>
  )
}