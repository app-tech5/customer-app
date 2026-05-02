import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { Marker, Callout } from '@maplibre/maplibre-react-native'
import { Ionicons } from '@expo/vector-icons'

/** Visual defaults only — user-facing strings come from the parent (i18n). */
const KIND_DEFAULTS = {
  driver: { icon: 'car-outline', color: '#2563eb' },
  customer: { icon: 'home-outline', color: '#16a34a' },
  restaurant: { icon: 'restaurant-outline', color: '#ea580c' },
}

const MapMarkerCalloutContext = createContext(null)

/**
 * Wrap `MapEntityMarker` siblings that should share a single open callout (one active id at a time).
 */
export function MapMarkerCalloutScope({ children }) {
  const [activeId, setActiveId] = useState(null)

  const toggleMarkerId = useCallback((markerId) => {
    setActiveId((prev) => (prev === markerId ? null : markerId))
  }, [])

  const clearIfActive = useCallback((markerId) => {
    setActiveId((prev) => (prev === markerId ? null : prev))
  }, [])

  const value = useMemo(
    () => ({ activeId, toggleMarkerId, clearIfActive }),
    [activeId, toggleMarkerId, clearIfActive]
  )

  return (
    <MapMarkerCalloutContext.Provider value={value}>{children}</MapMarkerCalloutContext.Provider>
  )
}

/**
 * Map pin + callout. Toggle logic lives here (with `MapMarkerCalloutScope`) or falls back to local state if no scope.
 */
export function MapEntityMarker({
  latitude,
  longitude,
  id,
  kind = 'customer',
  iconName,
  iconColor,
  calloutTitle,
  calloutSubtitle,
  anchor = 'bottom',
}) {
  const scope = useContext(MapMarkerCalloutContext)
  const [localCalloutOpen, setLocalCalloutOpen] = useState(false)

  const calloutOpen = scope ? scope.activeId === id : localCalloutOpen

  const handleMarkerPress = () => {
    if (scope) scope.toggleMarkerId(id)
    else setLocalCalloutOpen((open) => !open)
  }

  const clearIfActive = scope?.clearIfActive
  useEffect(() => {
    if (clearIfActive) clearIfActive(id)
    else setLocalCalloutOpen(false)
  }, [latitude, longitude, id, clearIfActive])

  const preset = KIND_DEFAULTS[kind] || KIND_DEFAULTS.customer
  const resolvedIcon = iconName || preset.icon
  const resolvedColor = iconColor || preset.color
  const lngLat = [longitude, latitude]

  const hasSubtitle =
    calloutSubtitle != null && String(calloutSubtitle).trim().length > 0

  const calloutContent =
    calloutOpen &&
    // (hasSubtitle ? (
    //   <Callout style={styles.calloutShiftAbovePin}>
    //     <View style={styles.calloutBox}>
    //       {!!calloutTitle && <Text style={styles.calloutTitle}>{calloutTitle}</Text>}
    //       <Text style={styles.calloutSubtitle}>{calloutSubtitle}</Text>
    //     </View>
    //   </Callout>
    // ) : (
      <Callout title={calloutTitle || ''} style={styles.calloutShiftAbovePin} />
    // ))

  return (
    <Marker
      lngLat={lngLat}
      id={id}
      anchor={anchor}
      onPress={handleMarkerPress}
      {...(Platform.OS === 'ios' ? { selected: !!calloutOpen } : {})}
    >
      <View style={styles.markerRoot} collapsable={false}>
        <View style={[styles.iconRing, { borderColor: resolvedColor }]}>
          <Ionicons name={resolvedIcon} size={22} color={resolvedColor} />
        </View>
        {calloutContent}
      </View>
    </Marker>
  )
}

export default MapEntityMarker

const styles = StyleSheet.create({
  /** Lifts the native callout above the 40px pin (callout is position:absolute over the marker). */
  calloutShiftAbovePin: {
    transform: [{ translateY: -56 }],
  },
  markerRoot: {
    alignItems: 'center',
  },
  iconRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2,
    elevation: 3,
  },
  calloutBox: {
    minWidth: 140,
    maxWidth: 260,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  calloutSubtitle: {
    fontSize: 13,
    color: '#4b5563',
  },
})
