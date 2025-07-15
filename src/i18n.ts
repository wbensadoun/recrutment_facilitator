import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from '@/locales/en/translation.json';
import translationFR from '@/locales/fr/translation.json';

const resources = {
  en: {
    translation: translationEN
  },
  fr: {
    translation: translationFR
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: navigator.language.startsWith('fr') ? 'fr' : 'en', // langue par défaut basée sur le navigateur
    fallbackLng: 'en', // langue de repli
    interpolation: {
      escapeValue: false // non nécessaire pour React
    },
    detection: {
      order: ['navigator', 'localStorage', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;
