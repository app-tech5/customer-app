import React, {createContext, useEffect, useState} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { installHermesE2eAuthHooks } from '../utils/hermesE2eHooks'

export const SignInContext = createContext()

export const SignInContextProvider = (props)=>{

    const [signedIn, setSignedIn] = useState(null)
    
    useEffect(() => {
        const initializeAuthState = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken')
                if (token) {
                    setSignedIn(token)
                }
            } catch (error) {
                console.error('Error initializing auth state:', error);
            }
        };

        initializeAuthState();
    }, []);

    useEffect(() => {
        if (__DEV__) {
            installHermesE2eAuthHooks(setSignedIn)
        }
    }, []);

    return (
            <SignInContext.Provider value={{signedIn, setSignedIn}}>

            {props.children}

        </SignInContext.Provider>

    )
}
  