import React from 'react'
import {createDrawerNavigator} from '@react-navigation/drawer'
import BottomTabs from './BottomTabs'
import DrawerContent from '../components/DrawerContent';
import { WalletSectionNavigator, SettingsSectionNavigator } from './Stacks';
import TabSearchRedirect from './TabSearchRedirect';
import TabAccountRedirect from './TabAccountRedirect';
import TabOrdersRedirect from './TabOrdersRedirect';
import NearMeScreen from '../screens/NearMeScreen';
import {
    navigateToTabHome,
    navigateToTabAccount,
    navigateToTabSearch,
    navigateToTabOrders,
} from './navigationHelpers';

import Offers from '../screens/Offers'
import { Ionicons, MaterialIcons, Entypo, Feather } from '@expo/vector-icons'
import i18n from '../lang/i18n';
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
        drawerActiveTintColor: colors.primary, 
        drawerInactiveTintColor: colors.grey[700], 
        drawerActiveBackgroundColor: 'rgba(0, 0, 0, 0.08)', 
        drawerInactiveBackgroundColor: 'transparent', 
    }}
    drawerContent= {props => <DrawerContent {...props}/>}
    >
        
        <Drawer.Screen
            name = "BottomTabs"
            component={BottomTabs}
            listeners={({ navigation }) => ({
                drawerItemPress: (e) => {
                    e.preventDefault()
                    navigateToTabHome(navigation)
                },
            })}
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
            component={TabSearchRedirect}
            listeners={({ navigation }) => ({
                drawerItemPress: (e) => {
                    e.preventDefault()
                    navigateToTabSearch(navigation, 'SearchScreen')
                },
            })}
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
            name = "NearMe"
            component={NearMeScreen}
            options={{
                title: i18n.t('search.nearMe'),
                headerShown: true,
                drawerIcon: ({focused, size}) => (
                    <Ionicons
                        name="location-outline"
                        color={focused ? colors.primary : colors.grey[700]}
                        size={size}
                    />
                )
            }}
        />
        
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

        <Drawer.Screen
            name = "Orders"
            component={TabOrdersRedirect}
            listeners={({ navigation }) => ({
                drawerItemPress: (e) => {
                    e.preventDefault()
                    navigateToTabOrders(navigation, 'Orders')
                },
            })}
            options={{
                title: i18n.t('drawer.orderHistory'),
                headerShown: false,
                drawerIcon: ({focused, size}) => (
                    <Feather
                        name="clock"
                        color={focused ? colors.primary : colors.grey[700]}
                        size={size}
                    />
                )
            }}
        />
        
        <Drawer.Screen
            name = "Account"
            component={TabAccountRedirect}
            listeners={({ navigation }) => ({
                drawerItemPress: (e) => {
                    e.preventDefault()
                    navigateToTabAccount(navigation, 'AccountScreen')
                },
            })}
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
        
        <Drawer.Screen
            name = "Wallet"
            component={WalletSectionNavigator}
            options={{
                title: i18n.t('drawer.wallet'),
                headerShown: false,
                drawerIcon: ({focused, size}) => (
                    <Entypo
                        name="wallet"
                        color={focused ? colors.primary : colors.grey[700]}
                        size={size}
                    />
                )
            }}
        />
        
        <Drawer.Screen
            name = "Settings"
            component={SettingsSectionNavigator}
            options={{
                title: i18n.t('drawer.settings'),
                headerShown: false,
                drawerIcon: ({focused, size}) => (
                    <Ionicons
                        name="settings-outline"
                        color={focused ? colors.primary : colors.grey[700]}
                        size={size}
                    />
                )
            }}
        />
        
    </Drawer.Navigator>
  )
}