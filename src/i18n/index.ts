import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import ur from "./ur.json";
import ar from "./ar.json";
import pl from "./pl.json";
import ro from "./ro.json";
import cy from "./cy.json";
import sk from "./sk.json";
import cs from "./cs.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ur: { translation: ur },
    ar: { translation: ar },
    pl: { translation: pl },
    ro: { translation: ro },
    cy: { translation: cy },
    sk: { translation: sk },
    cs: { translation: cs },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
