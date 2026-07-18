import { Button } from "@/components/ui/button";
import AnimatedSection from "@/components/AnimatedSection";
import { useTranslation, Trans } from "react-i18next";

const PaymentOptionsSection = () => {
  const { t } = useTranslation();

  const options = [
    { icon: "🏛️", title: t("payment.govTitle"), desc: t("payment.govDesc"), tag: t("payment.govTag") },
    { icon: "🎓", title: t("payment.studentTitle"), desc: t("payment.studentDesc"), tag: t("payment.studentTag") },
    { icon: "💼", title: t("payment.employerTitle"), desc: t("payment.employerDesc"), tag: t("payment.employerTag") },
    { icon: "💳", title: t("payment.selfPayTitle"), desc: t("payment.selfPayDesc"), tag: t("payment.selfPayTag") },
  ];

  return (
    <section id="payment-options" className="ks-card ks-section mt-4">
      <AnimatedSection>
        <span className="ks-tag text-xs font-bold uppercase tracking-widest">{t("payment.tag")}</span>
        <h2 className="text-2xl font-bold tracking-tight mt-2.5 mb-1.5">{t("payment.heading")}</h2>
        <p className="text-muted-foreground text-sm max-w-[62ch]">{t("payment.description")}</p>
      </AnimatedSection>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {options.map((o, i) => (
          <AnimatedSection key={i} delay={i * 0.08}>
            <div className="ks-tile h-full flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="ks-icon-box" aria-hidden="true">{o.icon}</div>
                <span className="ks-badge text-[11px]">{o.tag}</span>
              </div>
              <h3 className="font-semibold text-[15.5px] mb-2">{o.title}</h3>
              <p className="text-muted-foreground text-[13.5px] flex-1">{o.desc}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>

      <AnimatedSection delay={0.35}>
        <div className="mt-4 p-4 rounded-xl border border-border bg-white/60">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{t("payment.notSure")}</strong> {t("payment.notSureDesc")}
          </p>
          <div className="mt-2.5 flex gap-2.5 flex-wrap">
            <Button variant="hero" size="sm" asChild><a href="#contact">{t("payment.askFunding")}</a></Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="https://www.gov.uk/get-childcare" target="_blank" rel="noopener noreferrer">{t("payment.govGuide")}</a>
            </Button>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
};

export default PaymentOptionsSection;
