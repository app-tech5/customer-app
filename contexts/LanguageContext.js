import React, { useContext, useEffect, useState } from 'react'
import en from '../lang/en.json'
import fr from '../lang/fr.json'
import * as RNLocalize from 'react-native-localize'
 
const LanguageContext = createContext()

const languageObj = {
    'en': en,
    'fr': fr
}
export const LanguageContextProvider = (props)=>{

    const [selectedLanguage, setSelectedLanguage] = useState('en');

    useEffect(()=>{
        console.log(RNLocalize.getLocales())
        const currentLanguage = RNLocalize.findBestAvailableLanguage(Object.keys(languageObj));
        setSelectedLanguage(currentLanguage?.languageTag)

    }, [])

    const value = {
        ...languageObj[selectedLanguage],
    }

    return (
        <LanguageContext.Provider value={value}>

            {props.children}

        </LanguageContext.Provider>

    )
}

export const useTranslation = ()=> useContext(LanguageContext)

  