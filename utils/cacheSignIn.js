import AsyncStorage from '@react-native-async-storage/async-storage';
import { CACHE_KEYS, CACHE_CONFIG, cacheI18n as i18n } from './cacheCommon';

export const saveSignInData = async (email, rememberMe = true) => {
  try {
    if (!email || !rememberMe) {
      return;
    }

    const signInData = {
      email: email.trim().toLowerCase(),
      rememberMe: true,
      timestamp: Date.now(),
      version: CACHE_CONFIG.VERSION,
    };

    await AsyncStorage.setItem(
      CACHE_KEYS.USER_SIGNIN_DATA,
      JSON.stringify(signInData),
    );
  } catch (error) {
    console.error(i18n.t('cache.saveSignInError'), error);
  }
};

export const getSignInData = async () => {
  try {
    const cachedData = await AsyncStorage.getItem(CACHE_KEYS.USER_SIGNIN_DATA);

    if (!cachedData) {
      return null;
    }

    const parsedData = JSON.parse(cachedData);

    if (parsedData.version !== CACHE_CONFIG.VERSION) {
      await clearSignInData();
      return null;
    }

    return {
      email: parsedData.email,
      rememberMe: parsedData.rememberMe,
      timestamp: parsedData.timestamp,
    };
  } catch (error) {
    console.error(i18n.t('cache.readSignInError'), error);
    return null;
  }
};

export const clearSignInData = async () => {
  try {
    await AsyncStorage.removeItem(CACHE_KEYS.USER_SIGNIN_DATA);
  } catch (error) {
    console.error(i18n.t('cache.clearSignInError'), error);
  }
};

export const updateSignInEmail = async (newEmail) => {
  try {
    if (!newEmail) return;

    const existingData = await getSignInData();

    if (existingData) {
      await saveSignInData(newEmail, existingData.rememberMe);
    } else {
      await saveSignInData(newEmail, true);
    }
  } catch (error) {
    console.error(i18n.t('cache.updateEmailError'), error);
  }
};

