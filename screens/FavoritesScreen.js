import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native'
import React, { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useDispatch } from 'react-redux'
import { Ionicons } from '@expo/vector-icons'
import { getFavorites } from '../api'
import RestaurantItems from '../components/home/RestaurantItems'
import Loader from './Loader'
import i18n from '../lang/i18n'
import { colors } from '../global'
import { navigateToTabSearch } from '../navigation/navigationHelpers'

export default function FavoritesScreen({ navigation }) {
  const dispatch = useDispatch()
  const [favorites, setFavorites] = useState([])
  const [loader, setLoader] = useState(true)
  const [error, setError] = useState(null)

  const loadFavorites = useCallback(async () => {
    try {
      setLoader(true)
      setError(null)
      const response = await getFavorites()
      const list = response?.success && Array.isArray(response.favorites)
        ? response.favorites
        : []
      setFavorites(list)
      dispatch({
        type: 'SET_FAVORITES',
        payload: list.map((item) => item._id || item.id).filter(Boolean),
      })
    } catch (err) {
      console.error('Error loading favorites:', err)
      setError(i18n.t('profile.favoritesLoadError'))
      setFavorites([])
    } finally {
      setLoader(false)
    }
  }, [dispatch])

  useFocusEffect(
    useCallback(() => {
      loadFavorites()
    }, [loadFavorites])
  )

  React.useEffect(() => {
    navigation.setOptions({
      title: i18n.t('profile.favorites'),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 10, marginLeft: 5 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      ),
    })
  }, [navigation])

  const handleExplore = () => {
    navigateToTabSearch(navigation, 'SearchScreen')
  }

  const openRestaurant = useCallback((restaurant) => {
    navigation.navigate('BottomTabs', {
      screen: 'Home',
      params: {
        screen: 'RestaurantDetail',
        params: { restaurant },
      },
    })
  }, [navigation])

  const handleFavoriteChange = useCallback((restaurantId, isFavorite) => {
    if (!isFavorite) {
      setFavorites((prev) =>
        prev.filter((item) => String(item._id || item.id) !== String(restaurantId))
      )
    }
  }, [])

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.resultCount}>
        {i18n.t('profile.favoritesCount', { count: favorites.length })}
      </Text>
      <Text style={styles.subtitle}>{i18n.t('profile.manageFavorites')}</Text>
    </View>
  )

  const renderEmpty = () => {
    if (loader) return null

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="heart-outline" size={64} color={colors.grey[400]} />
        <Text style={styles.emptyTitle}>{i18n.t('profile.noFavoritesTitle')}</Text>
        <Text style={styles.emptySubtitle}>{i18n.t('profile.noFavoritesSubtitle')}</Text>
        <TouchableOpacity style={styles.exploreButton} onPress={handleExplore}>
          <Text style={styles.exploreButtonText}>{i18n.t('profile.exploreRestaurants')}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (loader && favorites.length === 0) {
    return <Loader />
  }

  if (error && favorites.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.emptyTitle}>{i18n.t('profile.errorTitle')}</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity style={styles.exploreButton} onPress={loadFavorites}>
            <Text style={styles.exploreButtonText}>{i18n.t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      <View style={styles.listWrapper}>
        <RestaurantItems
          restaurantData={favorites}
          navigation={navigation}
          size={0.92}
          onRestaurantPress={openRestaurant}
          onFavoriteChange={handleFavoriteChange}
          ListHeaderComponent={favorites.length > 0 ? renderHeader : null}
          ListEmptyComponent={renderEmpty}
          refreshing={loader}
          onRefresh={loadFavorites}
          contentContainerStyle={[
            styles.listContainer,
            favorites.length === 0 && styles.listContainerEmpty,
          ]}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  listWrapper: {
    flex: 1,
  },
  header: {
    paddingBottom: 16,
  },
  resultCount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  listContainerEmpty: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  exploreButtonText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
})
