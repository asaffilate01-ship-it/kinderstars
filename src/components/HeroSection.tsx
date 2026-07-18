import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";
import { motion } from "framer-motion";
import { useTranslation, Trans } from "react-i18next";

const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <section className="ks-card mt-5 p-5 md:p-6 relative overflow-hidden">
      <div
        className="absolute inset-[-2px] pointer-events-none"
        style={{
          background:
            "radial-gradient(680px 240px at 16% 8%, hsla(44,93%,57%,0.22), transparent 60%), radial-gradient(680px 260px at 92% 42%, hsla(200,93%,23%,0.14), transparent 60%)",
        }}
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-5 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="ks-tag text-xs font-bold uppercase tracking-widest">{t("hero.agencyTag")}</span>
            <span className="ks-tag text-xs font-semibold uppercase tracking-widest" style={{ borderColor: 'hsl(38 92% 50% / 0.5)', background: 'hsl(38 92% 50% / 0.12)', color: 'hsl(30 80% 30%)' }}>
              {t("hero.ofstedPending")}
            </span>
          </div>
          <h1 className="text-[clamp(28px,3.1vw,44px)] font-extrabold tracking-tight leading-tight max-w-[22ch] mb-2.5">
            {t("hero.headline")}
          </h1>
          <p className="text-muted-foreground text-base max-w-[66ch] mb-3">
            <Trans i18nKey="hero.description" components={{ strong: <strong /> }} />
          </p>
          <div className="flex gap-4 flex-wrap items-center text-xs text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5">{t("hero.dbsChecked")}</span>
            <span className="flex items-center gap-1.5">{t("hero.qualityAssured")}</span>
            <span className="flex items-center gap-1.5">{t("hero.privacyFirst")}</span>
          </div>
          <div className="flex gap-2.5 flex-wrap items-center">
            <Button variant="hero" asChild>
              <a href="/auth">Register Now</a>
            </Button>
            <Button variant="ghost" asChild>
              <a href="#parents">{t("hero.forParents")}</a>
            </Button>
          </div>
          <p className="text-xs mt-2.5 text-muted-foreground/60">
            <Trans i18nKey="hero.privacyNote" components={{ strong: <strong /> }} />
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="rounded-2xl overflow-hidden border border-border shadow-lg relative min-h-[290px]"
        >
          <img src={heroImage} alt="Parent and children doing activities together at home" className="w-full h-full object-cover block" />
          <div className="absolute left-3.5 bottom-3.5 px-3 py-2.5 rounded-full bg-white/85 border border-border text-xs backdrop-blur-sm">
            {t("hero.imageOverlay")}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
