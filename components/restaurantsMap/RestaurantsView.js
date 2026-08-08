import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlatList as RNFlatList, Platform, TouchableOpacity, View } from 'react-native'
import { FlatList as GHFlatList } from 'react-native-gesture-handler'
import { Icon } from 'react-native-elements'
import Reward from '../Reward'
import Categories from '../home/Categories'
import { RestaurantImage, RestaurantInfo } from '../home/RestaurantItems'
import { buildSortedRestaurants } from '../../utils'
import styles from './styles'

// gesture-handler FlatList snap is unreliable on web — cards stop between items.
const FlatList = Platform.OS === 'web' ? RNFlatList : GHFlatList

const ListButton = ({ setVisible, horizontal }) => {
  const iconName = horizontal ? 'menu' : 'map'

  return (
    <View style={styles.menuList}>
      <TouchableOpacity
        testID="restaurants-map-list-toggle-button"
        accessibilityLabel="restaurants-map-list-toggle-button"
        style={styles.menuListBloc}
        onPress={() => setVisible((prev) => !prev)}
      >
        <Icon
          type="material-community"
          name={iconName}
          color="#333"
          size={22}
        />
      </TouchableOpacity>
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
  targetCarouselIndex,
  onTargetCarouselIndexHandled,
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeout = useRef(null)
  const programmaticScrollRef = useRef(false)
  const snapInterval = width * 0.85 + 16
  const listPaddingLeft = 20
  const listPaddingRight = Math.max(20, width * 0.15 - 8)

  const sortedRestaurants = React.useMemo(() => {
    console.warn('🏪 RestaurantsView - Filtrage restaurants proches, horizontal:', horizontal)
    return buildSortedRestaurants(restaurantData, userLocation)
  }, [horizontal, restaurantData, userLocation])

  const snapOffsets = useMemo(
    () => sortedRestaurants.map((_, index) => index * snapInterval),
    [snapInterval, sortedRestaurants]
  )

  const calculateIndexFromScroll = useCallback((scrollX) => {
    return Math.max(
      0,
      Math.min(sortedRestaurants.length - 1, Math.round(scrollX / snapInterval))
    )
  }, [snapInterval, sortedRestaurants.length])

  const snapToCarouselIndex = useCallback((index, animated = true) => {
    if (!horizontal || index < 0 || index >= sortedRestaurants.length) return
    const offset = snapOffsets[index] ?? index * snapInterval
    restaurantsRef.current?.scrollToOffset({ offset, animated })
  }, [horizontal, restaurantsRef, snapInterval, snapOffsets, sortedRestaurants.length])

  const focusCarouselIndex = useCallback((index) => {
    const restaurant = sortedRestaurants[index]
    if (!restaurant || restaurant.originalIndex === undefined) return
    setCurrentIndex(index)
    setFocusFunction(restaurant.originalIndex)
    onSelectRestaurant?.(restaurant)
  }, [onSelectRestaurant, setFocusFunction, sortedRestaurants])

  const scrollToCarouselIndex = useCallback((index) => {
    if (!horizontal || index < 0 || index >= sortedRestaurants.length) return

    programmaticScrollRef.current = true
    setCurrentIndex(index)
    requestAnimationFrame(() => {
      snapToCarouselIndex(index, true)
      setTimeout(() => {
        programmaticScrollRef.current = false
      }, 450)
    })
  }, [horizontal, snapToCarouselIndex, sortedRestaurants.length])

  useEffect(() => {
    if (!horizontal || targetCarouselIndex == null) return
    scrollToCarouselIndex(targetCarouselIndex)
    onTargetCarouselIndexHandled?.()
  }, [horizontal, onTargetCarouselIndexHandled, scrollToCarouselIndex, targetCarouselIndex])

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [])

  return (
    <View
      testID={horizontal ? 'restaurants-map-horizontal-container' : 'restaurants-map-vertical-container'}
      accessibilityLabel={horizontal ? 'restaurants-map-horizontal-container' : 'restaurants-map-vertical-container'}
      style={horizontal ? styles.flatlist : null}
    >
      {setVisible && <ListButton setVisible={setVisible} horizontal={horizontal} />}
      <FlatList
        testID={horizontal ? 'restaurants-map-horizontal-list' : 'restaurants-map-vertical-list'}
        accessibilityLabel={horizontal ? 'restaurants-map-horizontal-list' : 'restaurants-map-vertical-list'}
        ref={restaurantsRef}
        horizontal={horizontal}
        data={sortedRestaurants}
        keyExtractor={(item, index) => `${item.id || item._id || index}`}
        renderItem={({ item, index }) => {
          const isActive = horizontal && index === currentIndex

          return (
            <TouchableOpacity
              testID={`restaurants-map-card-index-${index}`}
              accessibilityLabel={`restaurants-map-card-${item.id || item._id || index}`}
              style={{
                ...styles.restaurant,
                width: horizontal ? width * 0.85 : 'auto',
                transform: horizontal ? [{ scale: isActive ? 1 : 0.96 }] : [],
                // Keep cards opaque — opacity < 1 lets the map bleed through text on web.
                opacity: 1,
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
                <RestaurantImage
                  image={item.image}
                  restaurantId={item._id || item.id || item.restaurantId}
                />
                <RestaurantInfo
                  name={item.name}
                  rating={item.rating}
                  review_count={item.review_count}
                  city={item.city}
                  distance={item.distance}
                  deliveryTime={item.deliveryTime}
                  collectTime={item.collectTime}
                />
                {!horizontal && <Reward restaurant={item} />}
              </View>
            </TouchableOpacity>
          )
        }}
        scrollEnabled={horizontal ? true : scrollEnabled}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={
          horizontal
            ? { paddingLeft: listPaddingLeft, paddingRight: listPaddingRight }
            : undefined
        }
        snapToAlignment={horizontal ? 'start' : 'start'}
        snapToInterval={horizontal && Platform.OS !== 'web' ? snapInterval : undefined}
        snapToOffsets={horizontal && Platform.OS === 'web' ? snapOffsets : undefined}
        disableIntervalMomentum={!!horizontal}
        decelerationRate={horizontal ? 'fast' : 'normal'}
        onScrollBeginDrag={horizontal ? () => {
          setIsScrolling(true)
          programmaticScrollRef.current = false

          if (scrollTimeout.current) {
            clearTimeout(scrollTimeout.current)
          }
        } : undefined}
        onScrollEndDrag={horizontal ? (event) => {
          const scrollX = event.nativeEvent.contentOffset.x
          const finalIndex = calculateIndexFromScroll(scrollX)
          // Force a clean one-card snap (web often leaves the list between two cards).
          programmaticScrollRef.current = true
          snapToCarouselIndex(finalIndex, true)
          focusCarouselIndex(finalIndex)
          scrollTimeout.current = setTimeout(() => {
            setIsScrolling(false)
            programmaticScrollRef.current = false
          }, 120)
        } : undefined}
        onMomentumScrollEnd={horizontal ? (event) => {
          const scrollX = event.nativeEvent.contentOffset.x
          const finalIndex = calculateIndexFromScroll(scrollX)
          snapToCarouselIndex(finalIndex, true)
          focusCarouselIndex(finalIndex)
          setIsScrolling(false)
          programmaticScrollRef.current = false
        } : () => {}}
        onScroll={horizontal ? (event) => {
          const scrollX = event.nativeEvent.contentOffset.x
          const newIndex = calculateIndexFromScroll(scrollX)

          if (newIndex !== currentIndex) {
            setCurrentIndex(newIndex)
            if (!programmaticScrollRef.current) {
              const restaurant = sortedRestaurants[newIndex]
              if (restaurant?.originalIndex !== undefined) {
                setFocusFunction(restaurant.originalIndex)
                onSelectRestaurant?.(restaurant)
              }
            }
          }
        } : (event) => {
          setDirection(event.nativeEvent.contentOffset.y > offset ? 'up' : 'down')
          setOffset(event.nativeEvent.contentOffset.y)

          if (event.nativeEvent.contentOffset.y === 0 && direction === 'down') {
            setScrollEnabled(false)
          }
        }}
        onScrollToIndexFailed={horizontal ? (info) => {
          snapToCarouselIndex(info.index, true)
        } : undefined}
        getItemLayout={horizontal ? (_data, index) => ({
          length: snapInterval,
          offset: snapInterval * index,
          index,
        }) : undefined}
        ListHeaderComponent={!horizontal ? () => (
          <View style={styles.categories}>
            <Categories
              navigation={navigation}
              searchResultParams={{ fromRestaurantsMap: true }}
            />
          </View>
        ) : <></>}
      />
      {horizontal && sortedRestaurants.length > 1 && (
        <View style={styles.paginationContainer}>
          {sortedRestaurants.map((restaurant, index) => (
            <TouchableOpacity
              key={index}
              testID={`restaurants-map-pagination-dot-${index}`}
              accessibilityLabel={`restaurants-map-pagination-dot-${index}`}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
              onPress={() => {
                setCurrentIndex(index)
                scrollToCarouselIndex(index)
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
