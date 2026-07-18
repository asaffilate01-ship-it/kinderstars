import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import de from "./de.json";
import tr from "./tr.json";
import ar from "./ar.json";
import ur from "./ur.json";
import uk from "./uk.json";
import ru from "./ru.json";

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
    tr: { translation: tr },
    ar: { translation: ar },
    ur: { translation: ur },
    uk: { translation: uk },
    ru: { translation: ru },
  },
  lng: "de",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
