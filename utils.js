import * as Location from 'expo-location';


export const bearing = (φ1, λ1, φ2, λ2) => {

  const x = Math.sin((λ2 - λ1) * Math.PI / 180) * Math.cos(φ2 * Math.PI / 180);



  const y = Math.cos(φ1 * Math.PI / 180) * Math.sin(φ2 * Math.PI / 180) -
    Math.sin(φ1 * Math.PI / 180) * Math.cos(φ2 * Math.PI / 180) * Math.cos((λ2 - λ1) * Math.PI / 180);
  const θ = Math.atan2(x, y);



  return (θ * 180 / Math.PI + 360) % 360;



}

export const location = async () => {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
     setErrorMsg('Permission to access location was denied');
     return;
   }
     return Location
 };


export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}
