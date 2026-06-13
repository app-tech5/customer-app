export function getDrawerIndexForState(state) {
  if (!state?.routes?.length) {
    return state?.index ?? 0
  }

  const drawerRoute = state.routes[state.index]
  if (drawerRoute?.name !== 'BottomTabs' || !drawerRoute.state) {
    return state.index
  }

  const tabName = drawerRoute.state.routes[drawerRoute.state.index]?.name
  const tabToDrawerScreen = {
    Account: 'Account',
    Orders: 'Orders',
    Search: 'Search',
  }
  const drawerScreen = tabToDrawerScreen[tabName]

  if (!drawerScreen) {
    return state.routes.findIndex((route) => route.name === 'BottomTabs')
  }

  const drawerIndex = state.routes.findIndex((route) => route.name === drawerScreen)
  return drawerIndex >= 0 ? drawerIndex : state.index
}

function findBottomTabNavigator(navigation) {
  let nav = navigation

  while (nav) {
    const routeNames = nav.getState?.()?.routeNames
    if (routeNames?.includes('Home') && routeNames?.includes('Cart')) {
      return nav
    }
    nav = nav.getParent?.()
  }

  return null
}

export function navigateToTabHome(navigation) {
  const tabNav = findBottomTabNavigator(navigation)

  if (tabNav) {
    tabNav.navigate('Home', { screen: 'HomeScreen' })
    return
  }

  navigation.navigate('BottomTabs', {
    screen: 'Home',
    params: {
      screen: 'HomeScreen',
    },
  })
}

export function navigateToRestaurantsMap(navigation) {
  navigation.navigate('BottomTabs', {
    screen: 'Home',
    params: {
      screen: 'RestaurantsMapScreen',
    },
  })
}

export function navigateToTabSearch(navigation, screen = 'SearchScreen', params) {
  navigation.navigate('BottomTabs', {
    screen: 'Search',
    params: {
      screen,
      ...(params != null ? { params } : {}),
    },
  })
}

export function navigateToTabOrders(navigation, screen = 'Orders', params) {
  navigation.navigate('BottomTabs', {
    screen: 'Orders',
    params: {
      screen,
      ...(params != null ? { params } : {}),
    },
  })
}

export function resetToTabOrders(navigation) {
  let root = navigation
  while (root.getParent()) {
    root = root.getParent()
  }
  root.reset({
    index: 0,
    routes: [
      {
        name: 'DrawerNavigator',
        state: {
          routes: [
            {
              name: 'BottomTabs',
              state: {
                routes: [
                  {
                    name: 'Orders',
                    state: { routes: [{ name: 'Orders' }], index: 0 },
                  },
                ],
                index: 0,
              },
            },
          ],
          index: 0,
        },
      },
    ],
  })
}

export function navigateToTabAccount(navigation, screen = 'AccountScreen', params) {
  navigation.navigate('BottomTabs', {
    screen: 'Account',
    params: {
      screen,
      ...(params != null ? { params } : {}),
    },
  })
}

export function navigateToTabRestaurant(navigation, restaurant, extraParams = {}) {
  navigation.navigate('BottomTabs', {
    screen: 'Home',
    params: {
      screen: 'RestaurantDetail',
      params: { restaurant, ...extraParams },
    },
  })
}
