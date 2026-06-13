import React, { useCallback, useEffect, useRef, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { Icon } from 'react-native-elements'
import Reward from '../Reward'
import Categories from '../home/Categories'
import { RestaurantImage, RestaurantInfo } from '../home/RestaurantItems'
import { buildSortedRestaurants } from '../../utils'
import styles from './styles'

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

  const sortedRestaurants = React.useMemo(() => {
    console.warn('🏪 RestaurantsView - Filtrage restaurants proches, horizontal:', horizontal)
    return buildSortedRestaurants(restaurantData, userLocation)
  }, [horizontal, restaurantData, userLocation])

  const calculateIndexFromScroll = useCallback((scrollX) => {
    const adjusted = Math.max(0, scrollX - listPaddingLeft + snapInterval / 2)
    return Math.max(
      0,
      Math.min(sortedRestaurants.length - 1, Math.round(adjusted / snapInterval))
    )
  }, [listPaddingLeft, snapInterval, sortedRestaurants.length])

  const scrollToCarouselIndex = useCallback((index) => {
    if (!horizontal || index < 0 || index >= sortedRestaurants.length) return

    programmaticScrollRef.current = true
    setCurrentIndex(index)

    requestAnimationFrame(() => {
      restaurantsRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      })
    })
  }, [horizontal, restaurantsRef, sortedRestaurants.length])

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
          const scrollX = event.nativeEvent.contentOffset.x
          const finalIndex = calculateIndexFromScroll(scrollX)

          setCurrentIndex(finalIndex)
          setIsScrolling(false)
          programmaticScrollRef.current = false

          const originalIndex = sortedRestaurants[finalIndex]?.originalIndex
          if (originalIndex !== undefined) {
            setFocusFunction(originalIndex)
          }
        } : () => {}}
        onScroll={horizontal ? (event) => {
          const scrollX = event.nativeEvent.contentOffset.x
          const newIndex = calculateIndexFromScroll(scrollX)

          if (newIndex !== currentIndex) {
            setCurrentIndex(newIndex)
          }
        } : (event) => {
          setDirection(event.nativeEvent.contentOffset.y > offset ? 'up' : 'down')
          setOffset(event.nativeEvent.contentOffset.y)

          if (event.nativeEvent.contentOffset.y === 0 && direction === 'down') {
            setScrollEnabled(false)
          }
        }}
        onScrollToIndexFailed={horizontal ? (info) => {
          restaurantsRef.current?.scrollToOffset({
            offset: Math.max(0, info.index * snapInterval),
            animated: true,
          })
        } : undefined}
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
