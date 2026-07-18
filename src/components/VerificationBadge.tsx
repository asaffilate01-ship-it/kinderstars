import { ShieldCheck, ShieldQuestion, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Link } from "react-router-dom";

export type VerificationTier = "registered" | "verified" | "jugendamt_approved";

interface Props {
  tier: VerificationTier | null | undefined;
  size?: "sm" | "md";
}

const CONFIG: Record<VerificationTier, {
  label: string;
  short: string;
  tooltip: string;
  className: string;
  Icon: typeof ShieldCheck;
}> = {
  registered: {
    label: "KinderStars Registriert",
    short: "Registriert",
    tooltip:
      "Grundangaben geprüft. Noch nicht vollständig verifiziert – dies ist kein KinderStars-Qualitätsstandard und keine behördliche Zulassung.",
    className: "bg-muted text-muted-foreground border",
    Icon: ShieldQuestion,
  },
  verified: {
    label: "KinderStars Verifiziert",
    short: "Verifiziert",
    tooltip:
      "Geprüft nach dem privaten KinderStars-Qualitätsstandard (u. a. erweitertes Führungszeugnis, Referenzen, Video-Interview, Erste Hilfe). Dies ist keine behördliche Zulassung.",
    className: "bg-primary/10 text-primary border-primary/30",
    Icon: ShieldCheck,
  },
  jugendamt_approved: {
    label: "Jugendamt Approved",
    short: "Jugendamt",
    tooltip:
      "Eignung als Kindertagespflegeperson wurde vom zuständigen Jugendamt gemäß §23 SGB VIII bestätigt. Bestätigung liegt KinderStars vor.",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    Icon: BadgeCheck,
  },
};

export const VerificationBadge = ({ tier, size = "md" }: Props) => {
  const t = tier ?? "registered";
  const cfg = CONFIG[t];
  const Icon = cfg.Icon;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to="/verifizierung" aria-label={cfg.label}>
            <Badge
              variant="outline"
              className={`${cfg.className} gap-1 ${size === "sm" ? "text-xs" : ""}`}
            >
              <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
              <span>{size === "sm" ? cfg.short : cfg.label}</span>
            </Badge>
          </Link>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm leading-relaxed">
          {cfg.tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VerificationBadge;