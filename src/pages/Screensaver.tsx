import { useEffect, useState, useRef } from "react";
import { Maximize2, Pause, Play, ChevronLeft, ChevronRight } from "lucide-react";
import logo from "@/assets/kinderstars-logo.png";
import SEOHead from "@/components/SEOHead";

type Slide = {
  key: string;
  bg: string; // tailwind gradient classes
  render: (active: boolean) => JSX.Element;
};

const SLIDE_MS = 7000;

const Screensaver = () => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | null>(null);

  const slides: Slide[] = [
    {
      key: "logo",
      bg: "from-white via-white to-white",
      render: (active) => (
        <div className="flex flex-col items-center justify-center h-full text-center px-12">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[hsl(44_93%_57%)]/20 blur-3xl scale-150 animate-[glow-pulse_3s_ease-in-out_infinite]" />
            <img
              src={logo}
              alt="KinderStars"
              className={`relative w-[min(70vw,900px)] h-auto drop-shadow-2xl ${active ? "animate-[bounce-subtle_2.4s_ease-in-out_infinite]" : ""}`}
            />
          </div>
          <p className="mt-12 text-3xl md:text-5xl font-semibold text-[hsl(215_42%_15%)] tracking-tight animate-fade-in">
            Trusted childcare, nationwide.
          </p>
          <p className="mt-4 text-xl md:text-2xl text-[hsl(215_42%_25%)]/80 animate-fade-in">
            kinderstars.de
          </p>
        </div>
      ),
    },
    {
      key: "what",
      bg: "from-[hsl(200_93%_23%)] via-[hsl(200_93%_28%)] to-[hsl(222_95%_13%)]",
      render: () => (
        <div className="flex flex-col items-start justify-center h-full text-left px-16 md:px-32 max-w-7xl mx-auto">
          <span className="text-[hsl(44_93%_57%)] uppercase tracking-[0.3em] text-lg md:text-xl font-bold animate-fade-in">
            Who we are
          </span>
          <h2 className="mt-6 text-6xl md:text-8xl font-extrabold text-white leading-[1.05] animate-fade-in">
            A nationwide
            <br />
            <span className="text-[hsl(44_93%_57%)]">Childminder Agency</span>
          </h2>
          <p className="mt-10 text-2xl md:text-3xl text-white/85 max-w-4xl leading-relaxed animate-fade-in">
            KinderStars connects UK families with DBS-checked, quality-assured childminders — vetted, supported and matched by us.
          </p>
        </div>
      ),
    },
    {
      key: "provide",
      bg: "from-[hsl(36_100%_97%)] via-white to-[hsl(44_93%_92%)]",
      render: () => (
        <div className="flex flex-col h-full justify-center px-16 md:px-32 max-w-7xl mx-auto">
          <span className="text-[hsl(200_93%_23%)] uppercase tracking-[0.3em] text-lg md:text-xl font-bold animate-fade-in">
            What we provide
          </span>
          <h2 className="mt-4 text-5xl md:text-7xl font-extrabold text-[hsl(215_42%_15%)] animate-fade-in">
            Care that fits real life.
          </h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { t: "Vetted Childminders", d: "DBS-checked, Ofsted-aligned, fully insured." },
              { t: "Free Matching", d: "Tell us your needs — we do the legwork." },
              { t: "Funding Support", d: "Help with SFE, CCG and tax-free childcare." },
            ].map((c, i) => (
              <div
                key={c.t}
                className="bg-white rounded-3xl p-8 shadow-xl border border-[hsl(44_93%_57%)]/30 animate-fade-in"
                style={{ animationDelay: `${i * 150}ms`, animationFillMode: "backwards" }}
              >
                <div className="w-14 h-14 rounded-2xl bg-[hsl(44_93%_57%)] flex items-center justify-center text-2xl font-extrabold text-[hsl(215_42%_15%)] mb-5">
                  {i + 1}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-[hsl(215_42%_15%)]">{c.t}</h3>
                <p className="mt-3 text-lg md:text-xl text-[hsl(215_42%_25%)]/80 leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: "how",
      bg: "from-[hsl(222_95%_13%)] via-[hsl(200_93%_23%)] to-[hsl(222_95%_18%)]",
      render: () => (
        <div className="flex flex-col h-full justify-center px-16 md:px-32 max-w-7xl mx-auto">
          <span className="text-[hsl(44_93%_57%)] uppercase tracking-[0.3em] text-lg md:text-xl font-bold animate-fade-in">
            How we operate
          </span>
          <h2 className="mt-4 text-5xl md:text-7xl font-extrabold text-white animate-fade-in">
            Simple. Safe. Supportive.
          </h2>
          <ol className="mt-12 space-y-6">
            {[
              { t: "Tell us what you need", d: "Location, hours, ages and any extras." },
              { t: "We match you", d: "Curated childminders near you — usually within 48 hours." },
              { t: "Meet & decide", d: "Free intro visits. No pressure, no fees to start." },
              { t: "We stay involved", d: "Ongoing support, compliance, and quality checks." },
            ].map((s, i) => (
              <li
                key={s.t}
                className="flex items-start gap-6 animate-fade-in"
                style={{ animationDelay: `${i * 120}ms`, animationFillMode: "backwards" }}
              >
                <div className="shrink-0 w-16 h-16 rounded-full bg-[hsl(44_93%_57%)] flex items-center justify-center text-3xl font-extrabold text-[hsl(215_42%_15%)]">
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-2xl md:text-4xl font-bold text-white">{s.t}</h3>
                  <p className="text-lg md:text-2xl text-white/75 mt-1">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ),
    },
    {
      key: "stats",
      bg: "from-[hsl(44_93%_57%)] via-[hsl(44_93%_62%)] to-[hsl(44_93%_70%)]",
      render: () => (
        <div className="flex flex-col h-full justify-center items-center text-center px-16">
          <span className="text-[hsl(200_93%_23%)] uppercase tracking-[0.3em] text-lg md:text-xl font-bold animate-fade-in">
            By the numbers
          </span>
          <h2 className="mt-4 text-5xl md:text-7xl font-extrabold text-[hsl(215_42%_15%)] animate-fade-in">
            Trusted across the UK.
          </h2>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-20">
            {[
              { n: "100%", l: "DBS-checked" },
              { n: "UK", l: "Wide coverage" },
              { n: "Free", l: "To get matched" },
            ].map((s, i) => (
              <div
                key={s.l}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 200}ms`, animationFillMode: "backwards" }}
              >
                <div className="text-7xl md:text-9xl font-black text-[hsl(215_42%_15%)] tracking-tight">
                  {s.n}
                </div>
                <div className="mt-3 text-2xl md:text-3xl font-semibold text-[hsl(215_42%_15%)]/75">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: "cta",
      bg: "from-[hsl(36_100%_97%)] via-[hsl(44_93%_85%)] to-[hsl(44_93%_70%)]",
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-center px-16">
          <img src={logo} alt="KinderStars" className="w-[min(40vw,420px)] h-auto mb-10 animate-fade-in" />
          <h2 className="text-6xl md:text-8xl font-extrabold text-[hsl(215_42%_15%)] tracking-tight animate-fade-in">
            Find your childminder.
          </h2>
          <p className="mt-8 text-2xl md:text-4xl text-[hsl(215_42%_25%)]/85 animate-fade-in">
            Visit <span className="font-bold text-[hsl(200_93%_23%)]">kinderstars.de</span>
          </p>
          <p className="mt-4 text-xl md:text-2xl text-[hsl(215_42%_25%)]/70 animate-fade-in">
            hello@kinderstars.de · WhatsApp +49 30 12345678
          </p>
        </div>
      ),
    },
  ];

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, paused, slides.length]);

  // Auto-hide controls
  const resetHideTimer = () => {
    setShowControls(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setShowControls(false), 2500);
  };

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") setIndex((i) => (i + 1) % slides.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + slides.length) % slides.length);
      if (e.key.toLowerCase() === "p") setPaused((p) => !p);
      if (e.key.toLowerCase() === "f") toggleFullscreen();
      resetHideTimer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <>
      <SEOHead
        title="KinderStars Screensaver"
        description="Auto-playing slideshow about KinderStars — for display screens."
        canonical="https://www.kinderstars.de/screensaver"
      />
      <div
        ref={containerRef}
        className="fixed inset-0 bg-black overflow-hidden cursor-none"
        onMouseMove={resetHideTimer}
        onClick={resetHideTimer}
        style={{ cursor: showControls ? "default" : "none" }}
      >
        {/* Slides */}
        {slides.map((s, i) => {
          const active = i === index;
          const showWatermark = i !== 0 && s.key !== "cta"; // hero & cta already feature the logo prominently
          // Light backgrounds need slightly higher opacity to remain visible
          const lightBg = ["provide", "stats", "cta"].includes(s.key);
          const darkLogo = lightBg;
          return (
            <div
              key={s.key}
              className={`absolute inset-0 bg-gradient-to-br ${s.bg} transition-all duration-1000 ease-in-out ${
                active ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
              }`}
              aria-hidden={!active}
            >
              {/* Decorative drifting orbs */}
              <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl animate-[float_12s_ease-in-out_infinite]" />
              <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-white/10 blur-3xl animate-[float_16s_ease-in-out_infinite_reverse]" />

              {showWatermark && (
                <img
                  src={logo}
                  alt=""
                  aria-hidden="true"
                  className={`absolute top-6 left-6 w-20 md:w-24 lg:w-28 h-auto z-10 pointer-events-none drop-shadow-md opacity-90`}
                  style={{
                    filter: darkLogo
                      ? "brightness(0) saturate(100%) invert(15%) sepia(60%) saturate(1800%) hue-rotate(180deg) brightness(90%) contrast(95%)"
                      : "brightness(0) invert(1)",
                  }}
                />
              )}

              <div className="relative w-full h-full">{active && s.render(active)}</div>
            </div>
          );
        })}

        {/* Progress bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-black/20 z-20 transition-opacity duration-500 ${showControls ? "opacity-100" : "opacity-0"}`}>
          <div
            key={`${index}-${paused}`}
            className="h-full bg-white/80"
            style={{
              animation: paused ? "none" : `progress ${SLIDE_MS}ms linear forwards`,
              width: paused ? "100%" : undefined,
            }}
          />
        </div>

        {/* Slide indicator dots */}
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20 transition-opacity duration-500 ${showControls ? "opacity-100" : "opacity-0"}`}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-10 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className={`absolute top-6 right-6 flex gap-2 z-20 transition-opacity duration-500 ${showControls ? "opacity-100" : "opacity-0"}`}>
          <button
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
            className="p-3 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setPaused((p) => !p)}
            className="p-3 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
            aria-label={paused ? "Play" : "Pause"}
          >
            {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
            className="p-3 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
            aria-label="Fullscreen"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>

        {/* Hint */}
        <div className={`absolute bottom-8 right-8 text-white/60 text-sm z-20 transition-opacity duration-500 ${showControls ? "opacity-100" : "opacity-0"}`}>
          F · fullscreen   ·   ← → · navigate   ·   P · pause
        </div>
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(40px, -40px); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1.4); }
          50% { opacity: 0.8; transform: scale(1.6); }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </>
  );
};

export default Screensaver;
