import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { Icon } from 'react-native-elements'
import Reward from '../Reward'
import Categories from '../home/Categories'
import { RestaurantImage, RestaurantInfo } from '../home/RestaurantItems'
import i18n from '../../lang/i18n'
import { buildSortedRestaurants } from '../../utils'
import styles from './styles'

const ListButton = ({ setVisible }) => {
  return (
    <View style={styles.menuList}>
      <View style={styles.menuListBloc}>
        <Icon
          type="material-community"
          name="menu"
          color="black"
          size={32}
          onPress={() => setVisible(true)}
        />
        <Text style={{ fontWeight: 'bold' }}>{i18n.t('search.list')}</Text>
      </View>
    </View>
  )
}

export default function RestaurantsView({
  restaurantsRef,
  restaurantData,
  setFocusFunction,
  width,
  horizontal,
  scrollEnabled,
  offset,
  setOffset,
  direction,
  setDirection,
  setScrollEnabled,
  setVisible,
  navigation,
  userLocation,
  onSelectRestaurant,
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeout = useRef(null)

  const sortedRestaurants = React.useMemo(() => {
    console.warn('🏪 RestaurantsView - Filtrage restaurants proches, horizontal:', horizontal)
    return buildSortedRestaurants(restaurantData, userLocation)
  }, [horizontal, restaurantData, userLocation])

  const calculateIndexFromScroll = useCallback((scrollX, containerWidth) => {
    const itemWidth = containerWidth
    const rawIndex = scrollX / itemWidth
    return Math.max(0, Math.min(sortedRestaurants.length - 1, Math.round(rawIndex)))
  }, [sortedRestaurants.length])

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [])

  return (
    <View style={horizontal ? styles.flatlist : null}>
      {horizontal && <ListButton setVisible={setVisible} />}
      <FlatList
        ref={restaurantsRef}
        horizontal={horizontal}
        data={sortedRestaurants}
        keyExtractor={(item, index) => `${item.id || item._id || index}`}
        renderItem={({ item, index }) => {
          const isActive = horizontal && index === currentIndex

          return (
            <TouchableOpacity
              style={{
                ...styles.restaurant,
                width: horizontal ? width * 0.85 : 'auto',
                transform: horizontal ? [{ scale: isActive ? 1 : 0.95 }] : [],
                opacity: horizontal ? (isActive ? 1 : 0.7) : 1,
              }}
              onPress={() => navigation.navigate('RestaurantDetail', { restaurant: item })}
              activeOpacity={0.8}
            >
              <View
                style={{
                  ...styles.restaurantImageInfo,
                  paddingTop: horizontal ? 15 : 'auto',
                  paddingVertical: horizontal ? 'auto' : 10,
                  shadowColor: horizontal ? '#000' : 'transparent',
                  shadowOffset: horizontal ? { width: 0, height: 2 } : { width: 0, height: 0 },
                  shadowOpacity: horizontal ? 0.1 : 0,
                  shadowRadius: horizontal ? 4 : 0,
                  elevation: horizontal ? 3 : 0,
                }}
              >
                <RestaurantImage image={item.image} />
                <RestaurantInfo
                  name={item.name}
                  rating={item.rating}
                  city={item.city}
                />
                {!horizontal && <Reward restaurant={item} />}
              </View>
            </TouchableOpacity>
          )
        }}
        scrollEnabled={scrollEnabled}
        showsHorizontalScrollIndicator={false}
        snapToAlignment={horizontal ? 'center' : 'start'}
        snapToInterval={horizontal ? width * 0.85 + 16 : undefined}
        decelerationRate={horizontal ? 'fast' : 'normal'}
        onScrollBeginDrag={horizontal ? () => {
          setIsScrolling(true)

          if (scrollTimeout.current) {
            clearTimeout(scrollTimeout.current)
          }
        } : undefined}
        onScrollEndDrag={horizontal ? () => {
          scrollTimeout.current = setTimeout(() => {
            setIsScrolling(false)
          }, 100)
        } : undefined}
        onMomentumScrollEnd={horizontal ? (event) => {
          const { contentOffset, layoutMeasurement } = event.nativeEvent
          const scrollX = contentOffset.x
          const containerWidth = layoutMeasurement.width || width * 0.85
          const finalIndex = calculateIndexFromScroll(scrollX, containerWidth)

          setCurrentIndex(finalIndex)
          setIsScrolling(false)

          const originalIndex = sortedRestaurants[finalIndex]?.originalIndex
          if (originalIndex !== undefined) {
            setFocusFunction(originalIndex)
          }
        } : () => {}}
        onScroll={horizontal ? (event) => {
          const { contentOffset, layoutMeasurement } = event.nativeEvent
          const scrollX = contentOffset.x
          const containerWidth = layoutMeasurement.width || width * 0.85
          const newIndex = calculateIndexFromScroll(scrollX, containerWidth)

          if (newIndex !== currentIndex && !isScrolling) {
            setCurrentIndex(newIndex)

            const originalIndex = sortedRestaurants[newIndex]?.originalIndex
            if (originalIndex !== undefined) {
              setFocusFunction(originalIndex)
            }
          }
        } : (event) => {
          setDirection(event.nativeEvent.contentOffset.y > offset ? 'up' : 'down')
          setOffset(event.nativeEvent.contentOffset.y)

          if (event.nativeEvent.contentOffset.y === 0 && direction === 'down') {
            setScrollEnabled(false)
          }
        }}
        ListHeaderComponent={!horizontal ? () => (
          <View style={styles.categories}>
            <Categories />
          </View>
        ) : <></>}
      />
      {horizontal && sortedRestaurants.length > 1 && (
        <View style={styles.paginationContainer}>
          {sortedRestaurants.map((restaurant, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
              onPress={() => {
                setCurrentIndex(index)
                restaurantsRef.current?.scrollToIndex({
                  index,
                  animated: true,
                  viewPosition: 0.5,
                })

                onSelectRestaurant?.(restaurant)
                setFocusFunction(restaurant.originalIndex)
              }}
            />
          ))}
        </View>
      )}
    </View>
  )
}
