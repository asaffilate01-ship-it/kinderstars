import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { FileText } from "lucide-react";

const sections = [
  { key: "intro" },
  { key: "services" },
  { key: "eligibility" },
  { key: "obligations" },
  { key: "childminderTerms" },
  { key: "fees" },
  { key: "intellectualProperty" },
  { key: "liability" },
  { key: "termination" },
  { key: "governing" },
  { key: "contact" },
];

const TermsOfService = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEOHead title="Terms of Service" description="KinderStars terms of service. Read our terms and conditions for using our childminder agency platform." />
      <Navbar />
      <main className="max-w-[720px] mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-7 h-7 text-brand-accent" />
          <h1 className="text-2xl font-bold text-foreground">{t("terms.title")}</h1>
        </div>
        <p className="text-xs text-muted-foreground mb-8">{t("terms.lastUpdated")}</p>

        <div className="space-y-8">
          {sections.map((s, i) => (
            <section key={s.key}>
              <h2 className="text-base font-bold text-foreground mb-2">
                {i + 1}. {t(`terms.${s.key}.heading`)}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {t(`terms.${s.key}.body`)}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border">
          <Footer />
        </div>
      </main>
    </>
  );
};

export default TermsOfService;
