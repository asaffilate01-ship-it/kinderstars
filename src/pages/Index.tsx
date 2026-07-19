import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import ParentsSection from "@/components/ParentsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import WhyKinderStarsSection from "@/components/WhyKinderStarsSection";
import PaymentOptionsSection from "@/components/PaymentOptionsSection";
import ForChildmindersSection from "@/components/ForChildmindersSection";
import TestimonialsSection from "@/components/TestimonialsSection";

import FAQSection from "@/components/FAQSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import ScrollToTop from "@/components/ScrollToTop";
import WhatsAppButton from "@/components/WhatsAppButton";
import AnimatedSection from "@/components/AnimatedSection";
import SEOHead from "@/components/SEOHead";
import { useTranslation } from "react-i18next";

const SITE_URL = "https://www.kinderstars.de";

const Index = () => {
  const { t } = useTranslation();

  // Build FAQ structured data from i18n
  const faqItems = Array.from({ length: 12 }, (_, i) => ({
    "@type": "Question" as const,
    name: t(`faq.q${i + 1}`),
    acceptedAnswer: {
      "@type": "Answer" as const,
      text: t(`faq.a${i + 1}`),
    },
  }));

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "KinderStars GmbH",
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.png`,
    description: "KinderStars is a nationwide Childminder Agency helping UK parents find DBS-checked, quality-assured childminders.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Victory House",
      addressLocality: "Luton",
      postalCode: "LU1 3BS",
      addressCountry: "GB",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+49-30-12345678",
      email: "info@kinderstars.de",
      contactType: "customer service",
    },
    sameAs: [],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems,
  };

  return (
    <>
      <SEOHead
        title="Find Trusted Childminders Across the UK"
        description="KinderStars is a nationwide Childminder Agency helping UK parents find DBS-checked, quality-assured childminders. Browse, enquire, and get matched — free."
        canonical={SITE_URL}
        ogImage={`${SITE_URL}/favicon.png`}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      <main id="top" className="max-w-[1120px] mx-auto px-6">
        <AnimatedSection>
          <HeroSection />
        </AnimatedSection>
        <AnimatedSection delay={0.05}>
          <StatsBar />
        </AnimatedSection>
        <AnimatedSection>
          <ParentsSection />
        </AnimatedSection>
        <AnimatedSection>
          <HowItWorksSection />
        </AnimatedSection>
        <AnimatedSection>
          <WhyKinderStarsSection />
        </AnimatedSection>
        <AnimatedSection>
          <PaymentOptionsSection />
        </AnimatedSection>
        <AnimatedSection>
          <ForChildmindersSection />
        </AnimatedSection>
        <AnimatedSection>
          <TestimonialsSection />
        </AnimatedSection>


        <AnimatedSection>
          <FAQSection />
        </AnimatedSection>
        <AnimatedSection>
          <ContactSection />
        </AnimatedSection>
        <AnimatedSection>
          <Footer />
        </AnimatedSection>
      </main>
      <CookieBanner />
      <ScrollToTop />
      <WhatsAppButton />
    </>
  );
};

export default Index;
