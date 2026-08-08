import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import { DevSettings, I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { config } from '../config';
import en from './en.json';
import fr from './fr.json';
import es from './es.json';
import ar from './ar.json';

const i18n = new I18n({ en, fr, es, ar });

i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export const LANGUAGE_STORAGE_KEY = 'language';
export const RTL_LOCALES = ['ar'];
export const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English', badge: 'EN' },
  { code: 'fr', name: 'Français', badge: 'FR' },
  { code: 'es', name: 'Español', badge: 'ES' },
  { code: 'ar', name: 'العربية', badge: 'AR' },
];

export const isRtlLocale = (code) => RTL_LOCALES.includes(String(code || '').split('-')[0]);

export function getLanguageOption(code) {
  const base = String(code || '').split('-')[0];
  return LANGUAGE_OPTIONS.find((l) => l.code === base) || LANGUAGE_OPTIONS[0];
}

/**
 * Apply RTL layout when Arabic is selected. May require app reload on native.
 * Returns { needsReload } when direction flipped.
 */
export function applyLayoutDirection(locale) {
  const wantRtl = isRtlLocale(locale);
  const current = I18nManager.isRTL;
  if (wantRtl !== current) {
    I18nManager.allowRTL(wantRtl);
    I18nManager.forceRTL(wantRtl);
    return { needsReload: true, rtl: wantRtl };
  }
  return { needsReload: false, rtl: wantRtl };
}

function resolveDeviceLanguage() {
  try {
    if (Localization?.locale) {
      const code = Localization.locale.split('-')[0];
      if (i18n.translations[code]) return code;
    }
  } catch (error) {
    console.warn('Language detection error:', error.message);
  }
  return 'en';
}

function reloadAppIfNeeded(needsReload) {
  if (needsReload && typeof DevSettings?.reload === 'function') {
    DevSettings.reload();
    return true;
  }
  return false;
}

i18n.locale = resolveDeviceLanguage();

/**
 * UI language is always client-local (never writes Admin Setting /api/languages).
 * AsyncStorage only caches the choice so a required RTL native reload keeps it.
 * In DEMO_MODE that cache is cleared on logout (see resetLanguageAfterLogout).
 */
export async function initLanguage() {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && i18n.translations[saved]) {
      i18n.locale = saved;
    } else {
      i18n.locale = resolveDeviceLanguage();
    }
  } catch (_) {
    i18n.locale = resolveDeviceLanguage();
  }

  const layout = applyLayoutDirection(i18n.locale);
  // Native RTL can outlive AsyncStorage (e.g. demo logout cleared key but forceRTL stayed).
  if (layout.needsReload) {
    reloadAppIfNeeded(true);
  }
  return i18n.locale;
}

export const changeLanguage = async (
  language,
  { persist, reloadIfNeeded = false } = {}
) => {
  if (!i18n.translations[language]) {
    console.warn(`Unsupported language '${language}'. Available:`, Object.keys(i18n.translations));
    return { ok: false };
  }

  i18n.locale = language;

  // Never touches the backend. Persist locally only so RTL reload keeps the choice
  // for this device session. Demo logout clears it (see resetLanguageAfterLogout).
  const shouldPersist = persist !== undefined ? persist : true;
  if (shouldPersist) {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (_) {
      /* ignore */
    }
  }

  const layout = applyLayoutDirection(language);
  if (reloadIfNeeded) {
    reloadAppIfNeeded(layout.needsReload);
  }
  return { ok: true, ...layout };
};

/**
 * Demo: wipe local language + undo RTL so Sign-In is not stuck in Arabic.
 * Production: keep the user's local preference (still never synced to backend).
 */
export async function resetLanguageAfterLogout({ reloadIfNeeded = true } = {}) {
  if (!config.DEMO_MODE) {
    return { ok: true, skipped: true, locale: i18n.locale };
  }

  try {
    await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
  } catch (_) {
    /* ignore */
  }

  const fallback = resolveDeviceLanguage();
  i18n.locale = fallback;
  const layout = applyLayoutDirection(fallback);
  if (reloadIfNeeded) {
    reloadAppIfNeeded(layout.needsReload);
  }
  return { ok: true, locale: fallback, ...layout };
}

export const getCurrentLanguage = () => i18n.locale;

export const isLanguageSupported = (language) => !!i18n.translations[language];

export const supportedLanguages = Object.keys(i18n.translations);

if (typeof __DEV__ !== 'undefined' && __DEV__) {
  globalThis.__hermesSetLanguage = async (code, opts = {}) => {
    const result = await changeLanguage(code, { reloadIfNeeded: opts.reload !== false });
    return JSON.stringify(result);
  };
  globalThis.__hermesGetLanguage = () =>
    JSON.stringify({
      locale: i18n.locale,
      isRTL: I18nManager.isRTL,
      demoMode: !!config.DEMO_MODE,
      option: getLanguageOption(i18n.locale),
    });
  globalThis.__hermesResetLanguage = async () => {
    const result = await resetLanguageAfterLogout({ reloadIfNeeded: true });
    return JSON.stringify(result);
  };
}

export default i18n;
