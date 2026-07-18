import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Shield } from "lucide-react";

const sections = [
  { key: "intro" },
  { key: "whatWeCollect" },
  { key: "howWeUse" },
  { key: "cookies" },
  { key: "sharing" },
  { key: "rights" },
  { key: "retention" },
  { key: "children" },
  { key: "changes" },
  { key: "contact" },
];

const GDPRPolicy = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEOHead title="Privacy Policy (GDPR)" description="KinderStars privacy policy and GDPR compliance. Learn how we collect, use, and protect your personal data." />
      <Navbar />
      <main className="max-w-[720px] mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-7 h-7 text-brand-accent" />
          <h1 className="text-2xl font-bold text-foreground">{t("gdpr.title")}</h1>
        </div>
        <p className="text-xs text-muted-foreground mb-8">{t("gdpr.lastUpdated")}</p>

        <div className="space-y-8">
          {sections.map((s, i) => (
            <section key={s.key}>
              <h2 className="text-base font-bold text-foreground mb-2">
                {i + 1}. {t(`gdpr.${s.key}.heading`)}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {t(`gdpr.${s.key}.body`)}
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

export default GDPRPolicy;
