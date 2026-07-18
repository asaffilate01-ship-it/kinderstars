import AnimatedSection from "@/components/AnimatedSection";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";

const FAQSection = () => {
  const { t } = useTranslation();

  const faqs = Array.from({ length: 18 }, (_, i) => ({
    q: t(`faq.q${i + 1}`),
    a: t(`faq.a${i + 1}`),
  }));

  return (
    <section id="faq" className="ks-card ks-section mt-4">
      <AnimatedSection>
        <div className="text-center mb-5">
          <span className="ks-tag text-xs font-bold uppercase tracking-widest">{t("faq.tag")}</span>
          <h2 className="text-2xl font-bold tracking-tight mt-2.5">{t("faq.heading")}</h2>
          <p className="text-muted-foreground text-sm max-w-[52ch] mx-auto mt-1.5">{t("faq.description")}</p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <div className="max-w-[740px] mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border">
                <AccordionTrigger className="text-left text-sm font-semibold py-4 hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-[13.5px] leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </AnimatedSection>
    </section>
  );
};

export default FAQSection;
