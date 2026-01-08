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
          latitude: restaurant.lat,
          longitude: restaurant.lng,
          latitudeDelta: 0.09,
          longitudeDelta: 0.04 
        }}
       style={{height: height?height:200, width: "100%",
       }} showsUserLocation={true}
       >
<Polyline coordinates={[{
         latitude: userLocation.latitude,
         longitude: userLocation.longitude
       },
        {
          // latitude: 48.904634,
          // longitude: 2.432682

          latitude: restaurant.lat,
          longitude: restaurant.lng
        }]}
        strokeColor="#000"
        strokeColors={[
          "#7F0000",
          "#00000000",
          "#B24112",
          "#E5845C",
          "#238C23",
          "#7F0000"
        ]}
        strokeWidth={6}
        />
       </MapView>
  )
}
export default DisplayMapview