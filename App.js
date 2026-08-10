import './utils/hermesAutoOkAlerts';
import RootNavigation from "./navigation/navigation";
import {useFonts} from 'expo-font'
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SignInContextProvider } from './contexts/authContext';
import { initLanguage } from './lang/i18n';
import { installWebScrollFix } from './utils/installWebScrollFix';

import { 
  Roboto_100Thin,
  Roboto_100Thin_Italic,
  Roboto_300Light,
  Roboto_300Light_Italic,
  Roboto_400Regular,
  Roboto_400Regular_Italic,
  Roboto_500Medium,
  Roboto_500Medium_Italic,
  Roboto_700Bold,
  Roboto_700Bold_Italic,
  Roboto_900Black,
  Roboto_900Black_Italic 
} from '@expo-google-fonts/roboto'
import { cleanupExpiredCache } from "./utils/cacheUtils";
import { colors } from './global';

/** Web: only weights used in UI — loading 12 variants blocked first paint for seconds. */
const WEB_FONTS = {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
}

const NATIVE_FONTS = {
  Roboto_100Thin,
  Roboto_100Thin_Italic,
  Roboto_300Light,
  Roboto_300Light_Italic,
  Roboto_400Regular,
  Roboto_400Regular_Italic,
  Roboto_500Medium,
  Roboto_500Medium_Italic,
  Roboto_700Bold,
  Roboto_700Bold_Italic,
  Roboto_900Black,
  Roboto_900Black_Italic,
}

export default function App() {
  // i18n.locale is already set synchronously in lang/i18n.js — do not block first paint on AsyncStorage.
  const [langReady] = useState(true);

  let [fontsLoaded, error] = useFonts(
    Platform.OS === 'web' ? WEB_FONTS : NATIVE_FONTS
  )

  useEffect(() => {
    initLanguage().catch(console.error);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') installWebScrollFix()
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      cleanupExpiredCache().catch(console.error);
    }
  }, [fontsLoaded]);

  // Web: never stall forever on fonts — show UI after short grace period with system fallback.
  const [fontGraceDone, setFontGraceDone] = useState(Platform.OS !== 'web');
  useEffect(() => {
    if (Platform.OS !== 'web' || fontsLoaded) {
      setFontGraceDone(true);
      return;
    }
    const t = setTimeout(() => setFontGraceDone(true), 1200);
    return () => clearTimeout(t);
  }, [fontsLoaded]);

  if ((!fontsLoaded && !fontGraceDone) || !langReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white || '#fff' }}>
        <ActivityIndicator size="large" color={colors.primary || '#E23744'} />
      </View>
    )
  }
   
  return (
    <SignInContextProvider>
      <RootNavigation statusBarColor="black"/>
    </SignInContextProvider>
  );
}
