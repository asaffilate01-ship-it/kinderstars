import { useEffect, useRef, useState } from "react";
import AnimatedSection from "@/components/AnimatedSection";
import { useTranslation } from "react-i18next";

const useAnimatedCounter = (end: number, duration = 1500) => {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setValue(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return { value, ref };
};

const StatsBar = () => {
  const { t } = useTranslation();

  const counter1 = useAnimatedCounter(100, 1800);

  const stats = [
    { value: "Bundesweit", label: t("stats.nationwideCoverage"), isText: true },
    { value: "4.9★", label: t("stats.parentSatisfaction"), isText: true },
    { value: "§ 30 BZRG", label: t("stats.allChecksVerified"), isText: true },
    { value: "Geprüft", label: t("stats.assuredMonitored"), isText: true },
  ];

  return (
    <section className="ks-card mt-4 px-5 py-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <AnimatedSection key={i} delay={i * 0.08}>
            <div className="text-center">
              <div ref={i === 0 ? counter1.ref : undefined} className="text-2xl md:text-3xl font-extrabold tracking-tight text-secondary">
                {s.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          </AnimatedSection>
        ))}
      </div>

      {/* Trust Badges */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-4 border-t border-border">
        {[
          { label: "Erw. Führungszeugnis", icon: "🛡️" },
          { label: "DSGVO‑konform", icon: "🔒" },
          { label: "Jugendamt‑konform", icon: "⭐" },
          { label: "§ 8a SGB VIII", icon: "📋" },
          { label: "Erste‑Hilfe geschult", icon: "🏥" },
        ].map((badge) => (
          <span key={badge.label} className="ks-tag text-[11px] flex items-center gap-1.5 px-3 py-1.5">
            <span>{badge.icon}</span>
            {badge.label}
          </span>
        ))}
      </div>
    </section>
  );
};

export default StatsBar;
