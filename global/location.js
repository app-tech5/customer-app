import * as Location from 'expo-location';

export const location = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return;
  }
  return await Location.getCurrentPositionAsync({});
};
