import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as Localization from 'expo-localization';
import en from '../lang/en.json';
import fr from '../lang/fr.json';

const LanguageContext = createContext();

const languageObj = {
  en,
  fr,
};

function resolveLanguageTag() {
  const locales = Localization.getLocales?.() || [];
  const code = (locales[0]?.languageCode || 'en').toLowerCase();
  return languageObj[code] ? code : 'en';
}

export const LanguageContextProvider = (props) => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  useEffect(() => {
    setSelectedLanguage(resolveLanguageTag());
  }, []);

  const value = useMemo(
    () => ({
      ...languageObj[selectedLanguage],
      selectedLanguage,
      setSelectedLanguage,
    }),
    [selectedLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {props.children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
