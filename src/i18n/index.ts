import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en';
import ru from './locales/ru';
import tk from './locales/tk';
import tr from './locales/tr';

/** Add a new language: create locales/<code>.ts typed as Translation and register it here. */
export const LANGUAGES: { code: string; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
  { code: 'tk', name: 'Türkmençe' },
  { code: 'tr', name: 'Türkçe' },
];

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  tk: { translation: tk },
  tr: { translation: tr },
};

export function deviceLanguage(): string {
  const codes = getLocales().map((l) => l.languageCode ?? '');
  return codes.find((c) => c in resources) ?? 'en';
}

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnObjects: true,
});

export function applyLanguage(code: string | null) {
  i18n.changeLanguage(code ?? deviceLanguage());
}

export default i18n;
