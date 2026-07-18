import AnimatedSection from "@/components/AnimatedSection";
import { useTranslation } from "react-i18next";

const TestimonialsSection = () => {
  const { t } = useTranslation();

  const testimonials = [
    { quote: t("testimonials.quote1"), name: "Priya K.", location: "Luton, LU2", role: t("testimonials.quote1Role") },
    { quote: t("testimonials.quote2"), name: "James R.", location: "Milton Keynes, MK9", role: t("testimonials.quote2Role") },
    { quote: t("testimonials.quote3"), name: "Aisha K.", location: "Luton, LU2", role: t("testimonials.quote3Role") },
  ];

  return (
    <section id="testimonials" className="ks-card ks-section mt-4">
      <AnimatedSection>
        <div className="text-center mb-5">
          <span className="ks-tag text-xs font-bold uppercase tracking-widest">{t("testimonials.tag")}</span>
          <h2 className="text-2xl font-bold tracking-tight mt-2.5">{t("testimonials.heading")}</h2>
          <p className="text-muted-foreground text-sm max-w-[52ch] mx-auto mt-1.5">{t("testimonials.description")}</p>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {testimonials.map((te, i) => (
          <AnimatedSection key={te.name} delay={i * 0.1}>
            <div className="ks-tile flex flex-col justify-between h-full">
              <div>
                <div className="text-brand-accent text-2xl mb-2" aria-hidden="true">"</div>
                <p className="text-[13.5px] text-foreground/85 leading-relaxed italic">{te.quote}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <div className="font-bold text-sm">{te.name}</div>
                <div className="text-muted-foreground text-xs">{te.role} • {te.location}</div>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;
