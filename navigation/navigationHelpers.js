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
