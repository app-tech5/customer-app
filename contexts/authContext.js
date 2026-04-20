import React, {createContext, useEffect, useReducer, useState} from 'react'
import SignInReducer from '../redux/reducers/SignInReducer'
import AsyncStorage from '@react-native-async-storage/async-storage'

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

    return (
            <SignInContext.Provider value={{signedIn, setSignedIn}}>

            {props.children}

        </SignInContext.Provider>

    )
}
  