import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlatList as RNFlatList, Platform, TouchableOpacity, View } from 'react-native'
import { FlatList as GHFlatList } from 'react-native-gesture-handler'
import { Icon } from 'react-native-elements'
import Reward from '../Reward'
import Categories from '../home/Categories'
import { RestaurantImage, RestaurantInfo } from '../home/RestaurantItems'
import { buildSortedRestaurants } from '../../utils'
import styles from './styles'

const FlatList = Platform.OS === 'web' ? RNFlatList : GHFlatList
const isWeb = Platform.OS === 'web'
const CARD_GAP = 16
const LIST_PADDING_LEFT = 20

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

function RestaurantMapCard({
  item,
  index,
  horizontal,
  width,
  isActive,
  navigation,
}) {
  return (
    <TouchableOpacity
      testID={`restaurants-map-card-index-${index}`}
      accessibilityLabel={`restaurants-map-card-${item.id || item._id || index}`}
      style={{
        ...styles.restaurant,
        width: horizontal ? width * 0.85 : 'auto',
        marginHorizontal: horizontal && isWeb ? 0 : 8,
        transform: horizontal ? [{ scale: isActive ? 1 : 0.96 }] : [],
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
}

/**
 * Web-only: CSS scroll-snap. RN FlatList snapToOffsets still rests between cards in browsers.
 */
function WebHorizontalSnapCarousel({
  data,
  width,
  currentIndex,
  onIndexSettled,
  navigation,
  scrollRef,
}) {
  const scrollerRef = useRef(null)
  const settleTimerRef = useRef(null)
  const cardWidth = width * 0.85
  const stride = cardWidth + CARD_GAP
  const listPaddingRight = Math.max(20, width * 0.15 - 8)

  const scrollToIndex = useCallback((index, animated = true) => {
    const el = scrollerRef.current
    if (!el || index < 0 || index >= data.length) return
    el.scrollTo({
      left: index * stride,
      behavior: animated ? 'smooth' : 'auto',
    })
  }, [data.length, stride])

  useEffect(() => {
    if (!scrollRef) return
    scrollRef.current = {
      scrollToOffset: ({ offset, animated = true }) => {
        scrollerRef.current?.scrollTo({
          left: offset,
          behavior: animated ? 'smooth' : 'auto',
        })
      },
      scrollToIndex: (index, animated = true) => scrollToIndex(index, animated),
    }
  }, [scrollRef, scrollToIndex])

  const handleScroll = useCallback(() => {
    const el = scrollerRef.current
    if (!el || !data.length) return
    const index = Math.max(
      0,
      Math.min(data.length - 1, Math.round(el.scrollLeft / stride))
    )
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
    settleTimerRef.current = setTimeout(() => {
      onIndexSettled?.(index)
    }, 60)
  }, [data.length, onIndexSettled, stride])

  useEffect(
    () => () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
    },
    []
  )

  return (
    <div
      ref={scrollerRef}
      data-testid="restaurants-map-horizontal-list"
      onScroll={handleScroll}
      style={{
        display: 'flex',
        flexDirection: 'row',
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        scrollSnapType: 'x mandatory',
        scrollPaddingLeft: LIST_PADDING_LEFT,
        scrollPaddingRight: listPaddingRight,
        paddingLeft: LIST_PADDING_LEFT,
        paddingRight: listPaddingRight,
        gap: CARD_GAP,
        width: '100%',
        boxSizing: 'border-box',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}
    >
      <style>{`
        [data-testid="restaurants-map-horizontal-list"]::-webkit-scrollbar { display: none; }
      `}</style>
      {data.map((item, index) => (
        <div
          key={`${item.id || item._id || index}`}
          style={{
            flex: '0 0 auto',
            width: cardWidth,
            scrollSnapAlign: 'start',
            scrollSnapStop: 'always',
          }}
        >
          <RestaurantMapCard
            item={item}
            index={index}
            horizontal
            width={width}
            isActive={index === currentIndex}
            navigation={navigation}
          />
        </div>
      ))}
    </div>
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
  const scrollTimeout = useRef(null)
  const programmaticScrollRef = useRef(false)
  const cardWidth = width * 0.85
  const snapInterval = cardWidth + CARD_GAP
  const listPaddingRight = Math.max(20, width * 0.15 - 8)
  const useWebSnap = isWeb && horizontal

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

  const focusCarouselIndex = useCallback((index) => {
    const restaurant = sortedRestaurants[index]
    if (!restaurant || restaurant.originalIndex === undefined) return
    setCurrentIndex(index)
    setFocusFunction(restaurant.originalIndex)
    onSelectRestaurant?.(restaurant)
  }, [onSelectRestaurant, setFocusFunction, sortedRestaurants])

  const snapToCarouselIndex = useCallback((index, animated = true) => {
    if (!horizontal || index < 0 || index >= sortedRestaurants.length) return
    if (useWebSnap) {
      restaurantsRef.current?.scrollToIndex?.(index, animated)
      return
    }
    const nextOffset = snapOffsets[index] ?? index * snapInterval
    restaurantsRef.current?.scrollToOffset({ offset: nextOffset, animated })
  }, [
    horizontal,
    restaurantsRef,
    snapInterval,
    snapOffsets,
    sortedRestaurants.length,
    useWebSnap,
  ])

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

  const handleWebIndexSettled = useCallback((index) => {
    if (programmaticScrollRef.current) {
      setCurrentIndex(index)
      return
    }
    focusCarouselIndex(index)
  }, [focusCarouselIndex])

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
      style={horizontal ? styles.flatlist : styles.verticalListContainer}
    >
      {setVisible && <ListButton setVisible={setVisible} horizontal={horizontal} />}
      {useWebSnap ? (
        <WebHorizontalSnapCarousel
          data={sortedRestaurants}
          width={width}
          currentIndex={currentIndex}
          onIndexSettled={handleWebIndexSettled}
          navigation={navigation}
          scrollRef={restaurantsRef}
        />
      ) : (
        <FlatList
          testID={horizontal ? 'restaurants-map-horizontal-list' : 'restaurants-map-vertical-list'}
          accessibilityLabel={horizontal ? 'restaurants-map-horizontal-list' : 'restaurants-map-vertical-list'}
          ref={restaurantsRef}
          horizontal={horizontal}
          data={sortedRestaurants}
          keyExtractor={(item, index) => `${item.id || item._id || index}`}
          style={!horizontal ? styles.verticalList : undefined}
          renderItem={({ item, index }) => (
            <RestaurantMapCard
              item={item}
              index={index}
              horizontal={horizontal}
              width={width}
              isActive={horizontal && index === currentIndex}
              navigation={navigation}
            />
          )}
          scrollEnabled={horizontal ? true : true}
          nestedScrollEnabled
          showsVerticalScrollIndicator={!horizontal}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            horizontal
              ? { paddingLeft: LIST_PADDING_LEFT, paddingRight: listPaddingRight }
              : { paddingBottom: 24 }
          }
          snapToAlignment="start"
          snapToInterval={horizontal ? snapInterval : undefined}
          disableIntervalMomentum={!!horizontal}
          decelerationRate={horizontal ? 'fast' : 'normal'}
          onScrollBeginDrag={horizontal ? () => {
            programmaticScrollRef.current = false
            if (scrollTimeout.current) {
              clearTimeout(scrollTimeout.current)
            }
          } : undefined}
          onScrollEndDrag={horizontal ? (event) => {
            const scrollX = event.nativeEvent.contentOffset.x
            const finalIndex = calculateIndexFromScroll(scrollX)
            programmaticScrollRef.current = true
            snapToCarouselIndex(finalIndex, true)
            focusCarouselIndex(finalIndex)
            scrollTimeout.current = setTimeout(() => {
              programmaticScrollRef.current = false
            }, 120)
          } : undefined}
          onMomentumScrollEnd={horizontal ? (event) => {
            const scrollX = event.nativeEvent.contentOffset.x
            const finalIndex = calculateIndexFromScroll(scrollX)
            snapToCarouselIndex(finalIndex, true)
            focusCarouselIndex(finalIndex)
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
            setDirection?.(event.nativeEvent.contentOffset.y > offset ? 'up' : 'down')
            setOffset?.(event.nativeEvent.contentOffset.y)

            if (
              event.nativeEvent.contentOffset.y <= 0 &&
              direction === 'down' &&
              setVisible
            ) {
              // Pulling down at top of list closes sheet (mobile-like).
              setVisible(false)
              setScrollEnabled?.(false)
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
      )}
    </View>
  )
}
