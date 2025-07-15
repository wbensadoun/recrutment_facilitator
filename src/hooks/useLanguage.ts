import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

export type Language = 'en' | 'fr';

export function useLanguage() {
  const { i18n } = useTranslation();

  const changeLanguage = useCallback((language: Language) => {
    i18n.changeLanguage(language);
    // Stocker la préférence de langue
    localStorage.setItem('preferred-language', language);
  }, [i18n]);

  const currentLanguage = i18n.language as Language;

  return {
    currentLanguage,
    changeLanguage,
    isEnglish: currentLanguage === 'en',
    isFrench: currentLanguage === 'fr'
  };
}

export default useLanguage;
