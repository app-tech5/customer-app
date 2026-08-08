import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native'
import styles from './styles'

const isWeb = Platform.OS === 'web'
const TAB_BAR_OFFSET = isWeb ? 64 : 0
const COLLAPSED_RATIO = 0.55
const EXPANDED_RATIO = 0.88

/**
 * Map list bottom sheet: swipe up to expand, swipe down to collapse/close.
 * Web uses native DOM touch listeners — RN PanResponder does not swipe reliably in Chrome.
 */
export default function MapBottomSheet({
  visible,
  onClose,
  children,
}) {
  const { height: windowHeight } = useWindowDimensions()
  const usableHeight = Math.max(320, windowHeight - TAB_BAR_OFFSET)
  const collapsedHeight = Math.round(usableHeight * COLLAPSED_RATIO)
  const expandedHeight = Math.round(usableHeight * EXPANDED_RATIO)

  const [expanded, setExpanded] = useState(false)
  const [webHeight, setWebHeight] = useState(collapsedHeight)
  const heightAnim = useRef(new Animated.Value(collapsedHeight)).current
  const sheetRef = useRef(null)
  const handleRef = useRef(null)
  const modeRef = useRef('collapsed')
  const onCloseRef = useRef(onClose)
  const sizesRef = useRef({ collapsedHeight, expandedHeight })

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    sizesRef.current = { collapsedHeight, expandedHeight }
  }, [collapsedHeight, expandedHeight])

  const animateTo = useCallback((nextExpanded) => {
    const { collapsedHeight: c, expandedHeight: e } = sizesRef.current
    const target = nextExpanded ? e : c
    modeRef.current = nextExpanded ? 'expanded' : 'collapsed'
    setExpanded(nextExpanded)
    if (isWeb) {
      setWebHeight(target)
      return
    }
    Animated.spring(heightAnim, {
      toValue: target,
      useNativeDriver: false,
      bounciness: 4,
      speed: 14,
    }).start()
  }, [heightAnim])

  useEffect(() => {
    if (!visible) {
      modeRef.current = 'collapsed'
      setExpanded(false)
      setWebHeight(collapsedHeight)
      heightAnim.setValue(collapsedHeight)
      return
    }
    modeRef.current = 'collapsed'
    setExpanded(false)
    setWebHeight(collapsedHeight)
    heightAnim.setValue(collapsedHeight)
  }, [visible, collapsedHeight, heightAnim])

  useEffect(() => {
    if (!visible || isWeb) return
    Animated.spring(heightAnim, {
      toValue: expanded ? expandedHeight : collapsedHeight,
      useNativeDriver: false,
      bounciness: 4,
      speed: 14,
    }).start()
  }, [collapsedHeight, expanded, expandedHeight, heightAnim, visible])

  // Web DOM swipe on handle
  useEffect(() => {
    if (!isWeb || !visible) return undefined

    const handleNode = handleRef.current
    const sheetNode = sheetRef.current
    if (!handleNode || !sheetNode) return undefined

    handleNode.style.touchAction = 'none'
    handleNode.style.cursor = 'grab'
    handleNode.style.userSelect = 'none'
    handleNode.style.webkitUserSelect = 'none'

    let dragging = false
    let startY = 0
    let startH = collapsedHeight

    const readY = (event) => {
      if (event.touches?.[0]) return event.touches[0].clientY
      if (event.changedTouches?.[0]) return event.changedTouches[0].clientY
      return event.clientY
    }

    const applyHeight = (next) => {
      const { collapsedHeight: c, expandedHeight: e } = sizesRef.current
      const clamped = Math.max(Math.round(c * 0.4), Math.min(e, Math.round(next)))
      sheetNode.style.height = `${clamped}px`
      sheetNode.style.maxHeight = `${clamped}px`
      setWebHeight(clamped)
      return clamped
    }

    const onDown = (event) => {
      dragging = true
      startY = readY(event)
      startH = sheetNode.getBoundingClientRect().height || sizesRef.current.collapsedHeight
      sheetNode.style.transition = 'none'
      if (event.cancelable) event.preventDefault()
    }

    const onMove = (event) => {
      if (!dragging) return
      applyHeight(startH - (readY(event) - startY))
      if (event.cancelable) event.preventDefault()
    }

    const onUp = (event) => {
      if (!dragging) return
      dragging = false
      const dy = readY(event) - startY
      const h = sheetNode.getBoundingClientRect().height
      const { collapsedHeight: c, expandedHeight: e } = sizesRef.current
      sheetNode.style.transition = 'height 220ms ease-out'

      if (dy > 80) {
        if (modeRef.current === 'expanded') {
          animateTo(false)
          return
        }
        onCloseRef.current?.()
        return
      }
      if (dy < -70) {
        animateTo(true)
        return
      }
      animateTo(h > (c + e) / 2)
    }

    handleNode.addEventListener('touchstart', onDown, { passive: false })
    handleNode.addEventListener('touchmove', onMove, { passive: false })
    handleNode.addEventListener('touchend', onUp, { passive: true })
    handleNode.addEventListener('touchcancel', onUp, { passive: true })
    handleNode.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)

    return () => {
      handleNode.removeEventListener('touchstart', onDown)
      handleNode.removeEventListener('touchmove', onMove)
      handleNode.removeEventListener('touchend', onUp)
      handleNode.removeEventListener('touchcancel', onUp)
      handleNode.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [animateTo, collapsedHeight, visible])

  if (!visible) return null

  if (isWeb) {
    return (
      <div
        ref={sheetRef}
        data-testid="restaurants-map-bottom-sheet"
        aria-label="restaurants-map-bottom-sheet"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: TAB_BAR_OFFSET,
          height: webHeight,
          maxHeight: webHeight,
          background: '#fff',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
        }}
      >
        <div
          ref={handleRef}
          data-testid="restaurants-map-bottom-sheet-handle"
          aria-label="restaurants-map-bottom-sheet-handle"
          style={{
            paddingTop: 6,
            paddingBottom: 4,
            minHeight: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: '0 0 auto',
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: '#d9d9d9',
            }}
          />
        </div>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </div>
      </div>
    )
  }

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
    paddingTop: 6,
    paddingBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 20,
  },
  content: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
})
