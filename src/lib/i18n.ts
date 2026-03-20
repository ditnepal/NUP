import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      login_title: 'PPOS Login',
      login_subtitle: 'Political Party Organization System',
      nav_dashboard: 'Dashboard',
      nav_campaigns: 'Campaigns',
      nav_supporters: 'Supporters',
      nav_booths: 'Booths',
      logout: 'Logout'
    }
  },
  ne: {
    translation: {
      login_title: 'PPOS लगइन',
      login_subtitle: 'राजनीतिक दल संगठन प्रणाली',
      nav_dashboard: 'ड्यासबोर्ड',
      nav_campaigns: 'अभियानहरू',
      nav_supporters: 'समर्थकहरू',
      nav_booths: 'बुथहरू',
      logout: 'लगआउट'
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
