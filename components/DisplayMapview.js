import { View, Text } from 'react-native'
import React from 'react'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps' 
import MapViewDirections from 'react-native-maps-directions';
import { CustomMarker, DisplayMapviewDirections } from '../screens/OrderRequest'
const DisplayMapview = ({userLocation, mapRef, apikey, restaurant, height}) => {
  return (
    <MapView
        provider={PROVIDER_GOOGLE}
        ref={mapRef}
        initialRegion={{
          // ...userLocation,
          latitude: restaurant.coordinates?.latitude || 0,
          longitude: restaurant.coordinates?.longitude || 0,
          latitudeDelta: 0.09,
          longitudeDelta: 0.04
        }}
       style={{height: height?height:200, width: "100%",
       }} showsUserLocation={true}
       >
       </MapView>
  )
}
export default DisplayMapview