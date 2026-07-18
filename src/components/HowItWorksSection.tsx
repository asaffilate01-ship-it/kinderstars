import { Button } from "@/components/ui/button";
import AnimatedSection from "@/components/AnimatedSection";
import { useTranslation } from "react-i18next";

const HowItWorksSection = () => {
  const { t } = useTranslation();

  const steps = [
    { num: "01", icon: "🔍", title: t("howItWorks.step1Title"), desc: t("howItWorks.step1Desc") },
    { num: "02", icon: "📩", title: t("howItWorks.step2Title"), desc: t("howItWorks.step2Desc") },
    { num: "03", icon: "✅", title: t("howItWorks.step3Title"), desc: t("howItWorks.step3Desc") },
  ];

  return (
    <section id="how-it-works" className="ks-card ks-section mt-4">
      <AnimatedSection>
        <div className="text-center mb-5">
          <span className="ks-tag text-xs font-bold uppercase tracking-widest">{t("howItWorks.tag")}</span>
          <h2 className="text-2xl font-bold tracking-tight mt-2.5">{t("howItWorks.heading")}</h2>
          <p className="text-muted-foreground text-sm max-w-[52ch] mx-auto mt-1.5">{t("howItWorks.description")}</p>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((s, i) => (
          <AnimatedSection key={s.num} delay={i * 0.1}>
            <div className="ks-tile relative h-full">
              <span className="absolute top-3 right-3 text-xs font-extrabold text-muted-foreground/30">{s.num}</span>
              <div className="ks-icon-box" aria-hidden="true">{s.icon}</div>
              <h3 className="font-semibold text-[15.5px] mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-[13.5px]">{s.desc}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>

      <AnimatedSection delay={0.3}>
        <div className="mt-4 text-center">
          <Button variant="hero" asChild><a href="/auth">{t("nav.registerNow")}</a></Button>
        </div>
      </AnimatedSection>
    </section>
  );
};

export default HowItWorksSection;
