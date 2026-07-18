import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

const ScrollToTop = () => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(pct);
      setVisible(scrollTop > 300);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
      aria-label="Back to top"
    >
      <svg className="absolute inset-0 w-12 h-12 -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="2.5" />
        <circle
          cx="24" cy="24" r={radius} fill="none"
          stroke="hsl(var(--brand-accent))"
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-150"
        />
      </svg>
      <ArrowUp className="w-4 h-4 text-foreground relative z-10" />
    </button>
  );
};

export default ScrollToTop;
