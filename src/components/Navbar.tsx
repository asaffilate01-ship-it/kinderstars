import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "@/assets/kinderstars-logo.png";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Globe, LogIn } from "lucide-react";

const navLinks = [
  { href: "#parents", key: "forParents" },
  { href: "#how-it-works", key: "howItWorks" },
  { href: "#for-childminders", key: "forChildminders" },
  { href: "/blog", key: "blog", isRoute: true },
  { href: "#faq", key: "faq" },
  { href: "#contact", key: "contact" },
];

const languages = [
  { code: "en", label: "English", flag: "gb" },
  { code: "cy", label: "Cymraeg", flag: "gb-wls" },
  { code: "pl", label: "Polski", flag: "pl" },
  { code: "ro", label: "Română", flag: "ro" },
  { code: "sk", label: "Slovenčina", flag: "sk" },
  { code: "cs", label: "Čeština", flag: "cz" },
  { code: "ar", label: "العربية", flag: "sa" },
  { code: "ur", label: "اردو", flag: "pk" },
];

const Flag = ({ code }: { code: string }) => (
  <img
    src={`https://flagcdn.com/w40/${code}.png`}
    srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
    alt=""
    className="w-5 h-auto rounded-sm inline-block"
  />
);

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];
  const langRef = useRef<HTMLDivElement>(null);

  const resolveHref = (link: typeof navLinks[0]) => {
    if (link.isRoute) return link.href;
    return isHome ? link.href : `/${link.href}`;
  };

  const changeLang = (lang: typeof languages[0]) => {
    i18n.changeLanguage(lang.code);
    setLangOpen(false);
    document.documentElement.dir = lang.code === "ar" || lang.code === "ur" ? "rtl" : "ltr";
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md border-b border-border bg-background/82 dark:bg-background/90">
      <div className="max-w-[1120px] mx-auto px-6 py-3 flex items-center justify-between gap-3.5 flex-nowrap">
        <a href={isHome ? "#top" : "/"} aria-label="KinderStars Home" className="flex items-center gap-1" dir="ltr">
          <img src={logo} alt="KinderStars logo" className="w-[165px] h-auto drop-shadow-md" />
          <span className="text-[10px] font-bold leading-none" style={{ color: '#1a5276' }}>®</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-nowrap" aria-label="Primary">
          {navLinks.map((l) => (
            <a key={l.href} href={resolveHref(l)} className="text-muted-foreground hover:text-foreground px-2 py-2 rounded-xl border border-transparent hover:border-border hover:bg-white/65 text-[13px] transition-colors whitespace-nowrap">
              {t(`nav.${l.key}`)}
            </a>
          ))}

          {/* Language dropdown */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground px-2.5 py-2 rounded-xl border border-transparent hover:border-border hover:bg-white/65 text-sm transition-colors"
            >
              <Flag code={currentLang.flag} />
              <Globe className="w-3.5 h-3.5" />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-card border border-border rounded-xl shadow-lg z-50 py-1.5 overflow-hidden">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLang(lang)}
                    className={`w-full text-left px-3.5 py-2 text-sm flex items-center gap-2.5 hover:bg-muted transition-colors ${currentLang.code === lang.code ? "font-bold text-foreground" : "text-muted-foreground"}`}
                  >
                    <Flag code={lang.flag} />
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>



          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <a href="/auth"><LogIn className="w-3.5 h-3.5" /> Dashboard</a>
          </Button>
          <Button variant="hero" size="sm" asChild>
            <a href="/auth">{t("nav.registerNow")}</a>
          </Button>
        </nav>

        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="md:hidden p-2 rounded-xl border border-border hover:bg-white/65 transition-colors" aria-label="Open menu">
              <Menu className="w-5 h-5 text-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] bg-background p-6">
            <img src={logo} alt="KinderStars logo" className="w-[130px] h-auto mb-6" />
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={resolveHref(l)}
                  onClick={() => setOpen(false)}
                  className="text-foreground hover:text-secondary px-3 py-2.5 rounded-xl hover:bg-brand-accent/10 text-sm font-medium transition-colors"
                >
                  {t(`nav.${l.key}`)}
                </a>
              ))}
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2 px-3">{t("nav.language")}</p>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLang(lang)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm flex items-center gap-2.5 transition-colors ${currentLang.code === lang.code ? "font-bold text-foreground bg-muted" : "text-muted-foreground hover:bg-brand-accent/10"}`}
                  >
                    <Flag code={lang.flag} />
                    {lang.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <Button variant="outline" className="w-full gap-1.5" asChild>
                  <a href="/auth" onClick={() => setOpen(false)}><LogIn className="w-3.5 h-3.5" /> Dashboard</a>
                </Button>
                <Button variant="hero" className="w-full" asChild>
                  <a href="/auth" onClick={() => setOpen(false)}>
                    {t("nav.registerNow")}
                  </a>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Navbar;
