import { Button } from "@/components/ui/button";
import AnimatedSection from "@/components/AnimatedSection";
import { useTranslation } from "react-i18next";

const ParentsSection = () => {
  const { t } = useTranslation();

  const tiles = [
    { icon: "📍", title: t("parents.nationwideTitle"), desc: t("parents.nationwideDesc") },
    { icon: "🤝", title: t("parents.standardsTitle"), desc: t("parents.standardsDesc") },
    { icon: "💬", title: t("parents.supportTitle"), desc: t("parents.supportDesc") },
    { icon: "💷", title: t("parents.paymentTitle"), desc: t("parents.paymentDesc") },
  ];

  return (
    <section id="parents" className="ks-card ks-section mt-4">
      <AnimatedSection>
        <span className="ks-tag text-xs font-bold uppercase tracking-widest">{t("parents.tag")}</span>
        <h2 className="text-2xl font-bold tracking-tight mt-2.5 mb-1.5">{t("parents.heading")}</h2>
        <p className="text-muted-foreground text-sm max-w-[62ch]">{t("parents.description")}</p>
      </AnimatedSection>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3">
        {tiles.map((ti, i) => (
          <AnimatedSection key={i} delay={i * 0.08}>
            <div className="ks-tile h-full">
              <div className="ks-icon-box" aria-hidden="true">{ti.icon}</div>
              <h3 className="font-semibold text-[15.5px] mb-2">{ti.title}</h3>
              <p className="text-muted-foreground text-[13.5px]">{ti.desc}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>

      <AnimatedSection delay={0.3}>
        <div className="mt-3 flex gap-2.5 flex-wrap">
          <Button variant="hero" asChild><a href="/auth">{t("nav.registerNow")}</a></Button>
          <Button variant="ghost" asChild><a href="#contact">{t("parents.askHelp")}</a></Button>
        </div>
      </AnimatedSection>
    </section>
  );
};

export default ParentsSection;
