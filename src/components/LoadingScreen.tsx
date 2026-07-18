import { useState, useEffect } from "react";
import logo from "@/assets/kinderstars-logo.png";

const LoadingScreen = () => {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 1600);
    const remove = setTimeout(() => setVisible(false), 2100);
    return () => { clearTimeout(timer); clearTimeout(remove); };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-500 ${fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-[glow-pulse_2s_ease-in-out_infinite] scale-150" />
          <img
            src={logo}
            alt="KinderStars"
            className="relative w-[280px] h-auto drop-shadow-md animate-[bounce-subtle_1.2s_ease-in-out_infinite]"
          />
        </div>
        <div className="w-28 h-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-brand-accent rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
