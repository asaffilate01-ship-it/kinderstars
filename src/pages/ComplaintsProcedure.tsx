import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { AlertCircle } from "lucide-react";

const sections = [
  { key: "intro" },
  { key: "scope" },
  { key: "informal" },
  { key: "formal" },
  { key: "investigation" },
  { key: "escalation" },
  { key: "recordKeeping" },
  { key: "contact" },
];

const ComplaintsProcedure = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEOHead title="Complaints Procedure" description="KinderStars complaints procedure. Learn how to raise a complaint and how we handle and resolve issues." />
      <Navbar />
      <main className="max-w-[720px] mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-6">
          <AlertCircle className="w-7 h-7 text-brand-accent" />
          <h1 className="text-2xl font-bold text-foreground">{t("complaints.title")}</h1>
        </div>
        <p className="text-xs text-muted-foreground mb-8">{t("complaints.lastUpdated")}</p>

        <div className="space-y-8">
          {sections.map((s, i) => (
            <section key={s.key}>
              <h2 className="text-base font-bold text-foreground mb-2">
                {i + 1}. {t(`complaints.${s.key}.heading`)}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {t(`complaints.${s.key}.body`)}
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

export default ComplaintsProcedure;
