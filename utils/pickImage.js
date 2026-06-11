import * as ImagePicker from 'expo-image-picker';
import i18n from '../lang/i18n';

async function ensureLibraryPermission() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error(i18n.t('profile.photoPermissionDenied'));
  }
}

async function ensureCameraPermission() {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error(i18n.t('profile.photoPermissionDenied'));
  }
}

export async function pickImageFromLibrary() {
  await ensureLibraryPermission();
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });
  if (result.canceled) return null;
  return result.assets[0];
}

export async function pickImageFromCamera() {
  await ensureCameraPermission();
  const result = await ImagePicker.launchCameraAsync({
    quality: 0.8,
  });
  if (result.canceled) return null;
  return result.assets[0];
}
