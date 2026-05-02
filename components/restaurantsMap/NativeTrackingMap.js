import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, StyleSheet, Text } from 'react-native'
import { Camera, GeoJSONSource, Layer, Map } from '@maplibre/maplibre-react-native'
import MapEntityMarker, { MapMarkerCalloutScope } from './MapEntityMarker'
import { getPointFromLocation } from '../../utils/geoUtils'

const FIT_PADDING = { top: 48, right: 48, bottom: 48, left: 48 }
const DEFAULT_ZOOM = 13
const FALLBACK_STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
const MARKER_ID_DRIVER = 'tracking-driver'
const MARKER_ID_CUSTOMER = 'tracking-customer'

export default function NativeTrackingMap({
  driverLocation,
  customerLocation,
  style,
  driverCalloutTitle,
  driverCalloutSubtitle,
  customerCalloutTitle,
  customerCalloutSubtitle,
}) {
  const cameraRef = useRef(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [routeCoordinates, setRouteCoordinates] = useState([])
  const [routeDurationSeconds, setRouteDurationSeconds] = useState(null)

  const toPoint = (location) => {
    const point = getPointFromLocation(location)
    if (point) return point

    const lat = Number(location?.lat)
    const lng = Number(location?.lng)
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { latitude: lat, longitude: lng }
    }
    return null
  }

  const driverPoint = useMemo(
    () => toPoint(driverLocation),
    [driverLocation]
  )

  const customerPoint = useMemo(
    () => toPoint(customerLocation),
    [customerLocation]
  )

  const etaText = useMemo(() => {
    if (!Number.isFinite(routeDurationSeconds)) return null
    const eta = Math.max(1, Math.round(routeDurationSeconds / 60))
    return `ETA ~${eta} min`
  }, [routeDurationSeconds])

  const initialCenter = useMemo(() => {
    if (driverPoint) return [driverPoint.longitude, driverPoint.latitude]
    if (customerPoint) return [customerPoint.longitude, customerPoint.latitude]
    return [2.3522, 48.8566]
  }, [driverPoint, customerPoint])

  useEffect(() => {
    if (!isMapReady) return
    const camera = cameraRef.current
    if (!camera) return

    if (driverPoint && customerPoint) {
      const northEast = [
        Math.max(driverPoint.longitude, customerPoint.longitude),
        Math.max(driverPoint.latitude, customerPoint.latitude),
      ]
      const southWest = [
        Math.min(driverPoint.longitude, customerPoint.longitude),
        Math.min(driverPoint.latitude, customerPoint.latitude),
      ]
      const west = Math.min(driverPoint.longitude, customerPoint.longitude)
      const south = Math.min(driverPoint.latitude, customerPoint.latitude)
      const east = Math.max(driverPoint.longitude, customerPoint.longitude)
      const north = Math.max(driverPoint.latitude, customerPoint.latitude)
      camera.fitBounds([west, south, east, north], { padding: FIT_PADDING, duration: 500 })
      return
    }

    const only = driverPoint || customerPoint
    if (only) {
      camera.setStop({
        center: [only.longitude, only.latitude],
        zoom: DEFAULT_ZOOM,
        duration: 250,
      })
    }
  }, [driverPoint, customerPoint, isMapReady])

  useEffect(() => {
    let isCancelled = false

    const fetchRoute = async () => {
      if (!driverPoint || !customerPoint) {
        setRouteCoordinates([])
        setRouteDurationSeconds(null)
        return
      }

      try {
        const url =
          'https://router.project-osrm.org/route/v1/driving/' +
          `${driverPoint.longitude},${driverPoint.latitude};` +
          `${customerPoint.longitude},${customerPoint.latitude}` +
          '?overview=full&geometries=geojson'

        const response = await fetch(url)
        const data = await response.json()
        if (isCancelled) return

        const route = data?.routes?.[0]
        const coordinates = route?.geometry?.coordinates
        if (!Array.isArray(coordinates) || !coordinates.length) {
          setRouteCoordinates([])
          setRouteDurationSeconds(null)
          return
        }

        setRouteCoordinates(
          coordinates.map((coord) => ({
            latitude: Number(coord[1]),
            longitude: Number(coord[0]),
          }))
        )
        setRouteDurationSeconds(Number(route?.duration) || null)
      } catch (_error) {
        if (!isCancelled) {
          setRouteCoordinates([])
          setRouteDurationSeconds(null)
        }
      }
    }

    fetchRoute()

    return () => {
      isCancelled = true
    }
  }, [driverPoint, customerPoint])

  const routeGeoJson = useMemo(() => {
    if (routeCoordinates.length < 2) return null
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: routeCoordinates.map((c) => [c.longitude, c.latitude]),
      },
      properties: {},
    }
  }, [routeCoordinates])

  return (
    <View style={style}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={FALLBACK_STYLE_URL}
        onDidFinishLoadingMap={() => {
          setIsMapReady(true)
          console.log('[MapLibre] map loaded')
        }}
        // onRegionIsChanging={(e) => {
        //   const n = e?.nativeEvent;
        //   console.log('region changing', n?.center, n?.zoom);
        // }}
        // onRegionDidChange={(e) => {
        //   const n = e?.nativeEvent;
        //   console.log('region did change', n?.center, n?.zoom);
        // }}
        onDidFinishLoadingStyle={() => console.log('[MapLibre] style loaded')}
        onDidFailLoadingMap={(e) => console.log('[MapLibre] map failed', e?.nativeEvent)}
        onDidFinishRenderingMapFully={() => console.log('[MapLibre] map fully rendered')}

      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: initialCenter,
            zoom: DEFAULT_ZOOM,
          }}
        />
        {routeGeoJson && (
          <GeoJSONSource id="route-source" data={routeGeoJson}>
            <Layer
              id="route-layer"
              type="line"
              source="route-source"
              paint={{
                'line-color': '#2563eb',
                'line-width': 4,
                'line-opacity': 0.9,
              }}
            />
          </GeoJSONSource>
        )}
        <MapMarkerCalloutScope>
          {driverPoint && (
            <MapEntityMarker
              id={MARKER_ID_DRIVER}
              kind="driver"
              latitude={driverPoint.latitude}
              longitude={driverPoint.longitude}
              calloutTitle={driverCalloutTitle}
              calloutSubtitle={driverCalloutSubtitle}
            />
          )}
          {customerPoint && (
            <MapEntityMarker
              id={MARKER_ID_CUSTOMER}
              kind="customer"
              latitude={customerPoint.latitude}
              longitude={customerPoint.longitude}
              calloutTitle={customerCalloutTitle}
              calloutSubtitle={customerCalloutSubtitle}
            />
          )}
        </MapMarkerCalloutScope>
      </Map>
      {driverPoint && (
        <View style={styles.etaChip}>
          <Text style={styles.etaText}>{etaText || 'ETA --'}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  etaChip: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  etaText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
})
