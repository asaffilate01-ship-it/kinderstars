import { useState, useEffect, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TourStep {
  target: string; // CSS selector
  title: string;
  description: string;
}

interface WelcomeTourProps {
  steps: TourStep[];
  storageKey: string;
}

const WelcomeTour = ({ steps, storageKey }: WelcomeTourProps) => {
  const [current, setCurrent] = useState(0);
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      const timer = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const measure = useCallback(() => {
    if (!show) return;
    const el = document.querySelector(steps[current]?.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setPos({ top: rect.top + window.scrollY, left: rect.left, width: rect.width, height: rect.height });
    } else {
      setPos(null);
    }
  }, [current, show, steps]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [measure]);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(storageKey, "true");
  };

  if (!show || steps.length === 0) return null;

  const step = steps[current];
  const isLast = current === steps.length - 1;

  // Tooltip position: below the target by default
  const tooltipStyle: React.CSSProperties = pos
    ? {
        position: "absolute",
        top: pos.top + pos.height + 12,
        left: Math.max(12, Math.min(pos.left, window.innerWidth - 320)),
        zIndex: 10001,
      }
    : { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 10001 };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-foreground/40 z-[10000] transition-opacity" onClick={dismiss} />

      {/* Highlight ring */}
      {pos && (
        <div
          className="absolute rounded-xl border-2 border-primary shadow-lg shadow-primary/30 pointer-events-none z-[10000] transition-all duration-300"
          style={{ top: pos.top - 4, left: pos.left - 4, width: pos.width + 8, height: pos.height + 8 }}
        />
      )}

      {/* Tooltip card */}
      <div style={tooltipStyle} className="w-[300px] bg-card border border-border rounded-2xl shadow-xl p-4 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Step {current + 1} of {steps.length}
          </span>
          <button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <h4 className="font-bold text-sm mb-1">{step.title}</h4>
        <p className="text-xs text-muted-foreground mb-3">{step.description}</p>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          {isLast ? (
            <Button variant="hero" size="sm" onClick={dismiss}>
              Got it!
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={() => setCurrent((c) => c + 1)}>
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default WelcomeTour;
