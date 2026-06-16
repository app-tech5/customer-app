import React from 'react'
import { Camera, Map, Marker } from '@maplibre/maplibre-react-native'

const FALLBACK_STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

const DisplayMapview = ({ restaurant, height }) => {
  const latitude = Number(restaurant?.coordinates?.latitude) || 0
  const longitude = Number(restaurant?.coordinates?.longitude) || 0
  const lngLat = [longitude, latitude]

  return (
    <Map
      style={{ height: height || 200, width: '100%' }}
      mapStyle={FALLBACK_STYLE_URL}
    >
      <Camera
        defaultSettings={{
          centerCoordinate: lngLat,
          zoomLevel: 14,
        }}
      />
      <Marker id="restaurant-marker" lngLat={lngLat} />
    </Map>
  )
}

export default DisplayMapview
