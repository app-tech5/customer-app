import React from 'react'
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps'

const DisplayMapview = ({ userLocation: _userLocation, mapRef, apikey: _apikey, restaurant, height }) => {
  return (
    <MapView
        provider={PROVIDER_GOOGLE}
        ref={mapRef}
        initialRegion={{
          
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