import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { getFocusedRouteNameFromRoute } from '@react-navigation/native'
import { HomeNavigator, SearchNavigator, AccountNavigator, OrdersNavigator } from './Stacks'
import { CartNavigator } from './Stacks'
import { useSelector } from 'react-redux'
import { Ionicons, Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import i18n from '../lang/i18n'
import { colors } from '../global'

const Tab = createBottomTabNavigator()

const HIDE_TAB_ROUTES = new Set(['OrderChat', 'OrderTracking', 'OrderDetails'])

function tabBarVisibleForRoute(route) {
  const routeName = getFocusedRouteNameFromRoute(route)
  if (HIDE_TAB_ROUTES.has(routeName)) {
    return { display: 'none' }
  }
  return undefined
}

export default function BottomTabs() {
  const cartCount = useSelector((state) => state.cartReducer.length)

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.grey[700],
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="search" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartNavigator}
        options={({ route }) => ({
          headerShown: false,
          tabBarStyle: tabBarVisibleForRoute(route),
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#E53935',
            color: '#fff',
            fontSize: 10,
            minWidth: 16,
            height: 16,
            lineHeight: 14,
          },
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cart" size={size} color={color} />
          ),
        })}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersNavigator}
        options={({ route }) => ({
          headerShown: false,
          title: i18n.t('drawer.orderHistory'),
          tabBarStyle: tabBarVisibleForRoute(route),
          tabBarIcon: ({ color, size }) => (
            <Feather name="clock" color={color} size={size} />
          ),
        })}
      />
      <Tab.Screen
        name="Account"
        component={AccountNavigator}
        options={{
          headerShown: false,
          title: i18n.t('drawer.account'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}
