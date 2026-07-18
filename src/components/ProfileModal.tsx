import { Childminder, makeEnquiryMailto } from "@/lib/childminder-data";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ProfileModalProps {
  childminder: Childminder | null;
  onClose: () => void;
}

const ProfileModal = ({ childminder, onClose }: ProfileModalProps) => {
  const { t } = useTranslation();
  const [copyText, setCopyText] = useState(t("profile.copyReference"));

  useEffect(() => {
    setCopyText(t("profile.copyReference"));
  }, [t]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleCopy = useCallback(async () => {
    if (!childminder) return;
    try {
      await navigator.clipboard.writeText(childminder.id);
      setCopyText(t("profile.copied"));
      setTimeout(() => setCopyText(t("profile.copyReference")), 900);
    } catch {
      alert("Copy failed. Reference: " + childminder.id);
    }
  }, [childminder, t]);

  if (!childminder) return null;

  const cm = childminder;
  const displayName = `${cm.firstName} ${cm.lastInitial}.`;
  const details = [
    [t("profile.reference"), cm.id],
    [t("profile.postcodeDistrict"), cm.postcodeDistrict],
    [t("profile.town"), cm.town],
    [t("profile.ages"), cm.ageGroups.join(", ") || "—"],
    [t("profile.days"), cm.days.join(", ") || "—"],
    [t("profile.hours"), cm.hours || "—"],
    [t("profile.languages"), cm.languages.join(", ") || "—"],
    [t("profile.experience"), cm.experienceYears ? t("profile.yearsExp", { count: cm.experienceYears }) : "—"],
    [t("profile.status"), cm.verified ? t("profile.verified") : t("profile.listed")],
  ];

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      style={{ background: "hsla(222,55%,16%,0.35)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Childminder profile"
    >
      <div className="w-full max-w-[860px] bg-card rounded-[20px] border border-border shadow-2xl overflow-hidden animate-fade-in">
        <div
          className="px-5 py-4 flex items-start justify-between gap-3 border-b border-border"
          style={{ background: "linear-gradient(180deg, hsla(44,93%,57%,0.16), hsla(0,0%,100%,0.85))" }}
        >
          <div>
            <h3 className="font-bold text-lg tracking-tight">
              {displayName}{cm.verified ? ` • ${t("profile.verified")}` : ""}
            </h3>
            <div className="text-muted-foreground text-sm">
              {cm.postcodeDistrict} • {cm.town}
            </div>
          </div>
          <button onClick={onClose} className="text-xl leading-none p-1.5 hover:opacity-70" aria-label="Close">✕</button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-3">
            <div className="border border-border rounded-2xl p-3.5 bg-white/85">
              <h4 className="font-semibold mb-2">{t("profile.about")}</h4>
              <p className="text-muted-foreground text-[13.5px]">{cm.bio || t("profile.detailsOnRequest")}</p>
              <p className="text-xs text-muted-foreground/60 mt-2.5">{t("profile.privacyNote")}</p>
            </div>
            <div className="border border-border rounded-2xl p-3.5 bg-white/85">
              <h4 className="font-semibold mb-2">{t("profile.details")}</h4>
              <ul className="list-none p-0 m-0 text-[13.5px] text-foreground/82 space-y-1.5">
                {details.map(([k, v]) => (
                  <li key={k}><strong>{k}:</strong> {v}</li>
                ))}
              </ul>
              <div className="flex gap-2.5 flex-wrap mt-3">
                <Button variant="hero" size="sm" asChild>
                  <a href={makeEnquiryMailto(cm)}>{t("profile.sendEnquiry")}</a>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCopy}>{copyText}</Button>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-2">{t("profile.enquiryNote")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
