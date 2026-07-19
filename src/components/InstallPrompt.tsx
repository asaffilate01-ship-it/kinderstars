import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "ks-install-dismissed";

export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setVisible(false));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !evt) return null;

  const install = async () => {
    await evt.prompt();
    await evt.userChoice;
    setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 inset-x-4 z-50 md:left-auto md:right-4 md:w-80">
      <Card className="p-4 shadow-lg border-primary/20">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">KinderStars installieren</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Schneller Zugriff auf Buchungen, Nachrichten und Kurse — auch offline.
            </p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={install}>Installieren</Button>
              <Button size="sm" variant="ghost" onClick={dismiss}>Später</Button>
            </div>
          </div>
          <button aria-label="Schließen" onClick={dismiss} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}

export default InstallPrompt;