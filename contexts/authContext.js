import React, {createContext, useEffect, useReducer} from 'react'
import SignInReducer from '../redux/reducers/SignInReducer'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const SignInContext = createContext()

export const SignInContextProvider = (props)=>{

    const [signedIn, dispatchSignedIn] = useReducer(SignInReducer, {
        userToken: null
    })

    // Initialiser l'état d'authentification depuis AsyncStorage au démarrage
    useEffect(() => {
        const initializeAuthState = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken')
                if (token) {
                    dispatchSignedIn({
                        userToken: token
                    });
                }
            } catch (error) {
                console.error('Error initializing auth state:', error);
            }
        };

        initializeAuthState();
    }, []);

    return (
        <SignInContext.Provider value={{signedIn, dispatchSignedIn}}>

            {props.children}

        </SignInContext.Provider>

    )
}

  