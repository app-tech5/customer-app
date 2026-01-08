import RootNavigation from "./navigation/navigation";
import { SafeAreaView, StatusBar} from "react-native";
import {useFonts} from 'expo-font'


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

   if(!fontsLoaded)
   return <Loader />
   
  return (
    <RootNavigation statusBarColor="black"/>
  );
}
