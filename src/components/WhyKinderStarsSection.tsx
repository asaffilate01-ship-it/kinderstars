import AnimatedSection from "@/components/AnimatedSection";
import { useTranslation } from "react-i18next";

const WhyKinderStarsSection = () => {
  const { t } = useTranslation();

  const benefits = [
    { icon: "🛡️", title: t("whyUs.safeguardingTitle"), desc: t("whyUs.safeguardingDesc") },
    { icon: "📋", title: t("whyUs.qualityTitle"), desc: t("whyUs.qualityDesc") },
    { icon: "🔒", title: t("whyUs.privacyTitle"), desc: t("whyUs.privacyDesc") },
    { icon: "🌍", title: t("whyUs.multilingualTitle"), desc: t("whyUs.multilingualDesc") },
    { icon: "📞", title: t("whyUs.ongoingSupportTitle"), desc: t("whyUs.ongoingSupportDesc") },
    { icon: "💷", title: t("whyUs.fundingTitle"), desc: t("whyUs.fundingDesc") },
  ];

  return (
    <section id="why-kinderstars" className="ks-card ks-section mt-4">
      <AnimatedSection>
        <div className="mb-4">
          <span className="ks-tag text-xs font-bold uppercase tracking-widest">{t("whyUs.tag")}</span>
          <h2 className="text-2xl font-bold tracking-tight mt-2.5">{t("whyUs.heading")}</h2>
          <p className="text-muted-foreground text-sm max-w-[62ch] mt-1.5">{t("whyUs.description")}</p>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {benefits.map((b, i) => (
          <AnimatedSection key={i} delay={i * 0.06}>
            <div className="ks-tile h-full">
              <div className="ks-icon-box" aria-hidden="true">{b.icon}</div>
              <h3 className="font-semibold text-[15.5px] mb-2">{b.title}</h3>
              <p className="text-muted-foreground text-[13.5px]">{b.desc}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
};

export default WhyKinderStarsSection;
