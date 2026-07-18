import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const CookieBanner = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-lg mx-auto bg-card border border-border rounded-2xl shadow-xl p-5 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Cookie className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">{t("cookie.title")}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t("cookie.description")}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={decline}>
            {t("cookie.decline")}
          </Button>
          <Button variant="hero" size="sm" onClick={accept}>
            {t("cookie.accept")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
