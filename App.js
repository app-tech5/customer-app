import RootNavigation from "./navigation/navigation";
import {useFonts} from 'expo-font'
import { useEffect } from 'react';
import { SignInContextProvider } from './contexts/authContext';
import { Provider as ReduxProvider } from 'react-redux' 
import configureStore from './redux/store'

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
import Loader from "./screens/Loader";
import { cleanupExpiredCache } from "./utils/cacheUtils";

const store = configureStore();

export default function App() {

  let [fontsLoaded, error] = useFonts({

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

  })

  useEffect(() => {
    if (fontsLoaded) {
      cleanupExpiredCache().catch(console.error);
    }
  }, [fontsLoaded]);

   if(!fontsLoaded)
   return <Loader />
   
  return (
    <SignInContextProvider>
      <ReduxProvider store={store}><RootNavigation statusBarColor="black"/></ReduxProvider>
    </SignInContextProvider>
  );
}
