import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native'
import styles from './styles'

const TAB_BAR_OFFSET = Platform.OS === 'web' ? 64 : 0
const COLLAPSED_RATIO = 0.55
const EXPANDED_RATIO = 0.88

/**
 * Map list bottom sheet: swipe up to expand, swipe down to collapse/close,
 * restaurant list scrolls inside when content is taller than the sheet.
 */
export default function MapBottomSheet({
  visible,
  onClose,
  children,
}) {
  const { height: windowHeight } = useWindowDimensions()
  const usableHeight = Math.max(320, windowHeight - TAB_BAR_OFFSET)
  const collapsedHeight = usableHeight * COLLAPSED_RATIO
  const expandedHeight = usableHeight * EXPANDED_RATIO

  const [expanded, setExpanded] = useState(false)
  const heightAnim = useRef(new Animated.Value(collapsedHeight)).current
  const dragStartHeight = useRef(collapsedHeight)
  const expandedRef = useRef(false)

  useEffect(() => {
    expandedRef.current = expanded
  }, [expanded])

  useEffect(() => {
    if (!visible) {
      setExpanded(false)
      heightAnim.setValue(collapsedHeight)
      return
    }
    Animated.spring(heightAnim, {
      toValue: expanded ? expandedHeight : collapsedHeight,
      useNativeDriver: false,
      bounciness: 4,
      speed: 14,
    }).start()
  }, [visible, expanded, collapsedHeight, expandedHeight, heightAnim])

  const animateTo = useCallback((nextExpanded) => {
    setExpanded(nextExpanded)
    Animated.spring(heightAnim, {
      toValue: nextExpanded ? expandedHeight : collapsedHeight,
      useNativeDriver: false,
      bounciness: 4,
      speed: 14,
    }).start()
  }, [collapsedHeight, expandedHeight, heightAnim])

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
        onPanResponderGrant: () => {
          heightAnim.stopAnimation((value) => {
            dragStartHeight.current = value
          })
        },
        onPanResponderMove: (_, gesture) => {
          const next = Math.min(
            expandedHeight,
            Math.max(collapsedHeight * 0.45, dragStartHeight.current - gesture.dy)
          )
          heightAnim.setValue(next)
        },
        onPanResponderRelease: (_, gesture) => {
          const { dy, vy } = gesture
          // Swipe down hard / far → close sheet (back to carousel)
          if (dy > 90 || (dy > 40 && vy > 0.85)) {
            if (expandedRef.current) {
              animateTo(false)
              return
            }
            onClose?.()
            return
          }
          // Swipe up → expand
          if (dy < -70 || (dy < -30 && vy < -0.7)) {
            animateTo(true)
            return
          }
          // Snap to nearest
          heightAnim.stopAnimation((value) => {
            const mid = (collapsedHeight + expandedHeight) / 2
            animateTo(value > mid)
          })
        },
      }),
    [animateTo, collapsedHeight, expandedHeight, heightAnim, onClose]
  )

  if (!visible) return null

  return (
    <Animated.View
      testID="restaurants-map-bottom-sheet"
      accessibilityLabel="restaurants-map-bottom-sheet"
      style={[
        styles.bottomSheet,
        localStyles.sheet,
        {
          height: heightAnim,
          bottom: TAB_BAR_OFFSET,
        },
      ]}
    >
      <View
        testID="restaurants-map-bottom-sheet-handle"
        accessibilityLabel="restaurants-map-bottom-sheet-handle"
        style={localStyles.handleHit}
        {...panResponder.panHandlers}
      >
        <View style={styles.bottomSheetHandle} />
      </View>
      <View style={localStyles.content}>{children}</View>
    </Animated.View>
  )
}

const localStyles = StyleSheet.create({
  sheet: {
    overflow: 'hidden',
    flexDirection: 'column',
    zIndex: 40,
    elevation: 40,
  },
  handleHit: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
})
