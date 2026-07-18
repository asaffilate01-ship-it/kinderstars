import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Childminder, makeEnquiryMailto } from "@/lib/childminder-data";
import { useChildminders } from "@/hooks/use-childminders";
import { Button } from "@/components/ui/button";
import ProfileModal from "@/components/ProfileModal";
import VerificationBadge from "@/components/VerificationBadge";

const DirectorySection = () => {
  const { t } = useTranslation();
  const { data: db = [], isLoading } = useChildminders();
  const [query, setQuery] = useState("");
  const [ageFilter, setAgeFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [selectedCm, setSelectedCm] = useState<Childminder | null>(null);

  const hasSearch = query.trim() !== "" || ageFilter !== "" || dayFilter !== "";

  const filtered = useMemo(() => {
    if (!hasSearch) return [];
    const q = query.trim().toLowerCase();
    return db.filter((cm) => {
      if (q) {
        const hay = [cm.firstName, cm.lastInitial, cm.town, cm.postcodeDistrict, cm.id, ...cm.languages].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (ageFilter && !cm.ageGroups.includes(ageFilter)) return false;
      if (dayFilter && !cm.days.includes(dayFilter)) return false;
      return true;
    });
  }, [db, query, ageFilter, dayFilter, hasSearch]);

  const reset = useCallback(() => {
    setQuery("");
    setAgeFilter("");
    setDayFilter("");
  }, []);

  return (
    <section id="directory" className="ks-card ks-section mt-4">
      <div className="flex justify-between items-end gap-3 flex-wrap mb-2.5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">{t("directory.heading")}</h2>
          <p className="text-muted-foreground text-[13.5px]">{t("directory.description")}</p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <Button variant="ghost" size="sm" onClick={reset}>{t("directory.reset")}</Button>
          <Button variant="hero" size="sm" asChild><a href="#contact">{t("directory.cantFind")}</a></Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr_auto] gap-2.5 mt-3">
        <div className="ks-field">
          <label>{t("directory.searchLabel")}</label>
          <input placeholder={t("directory.searchPlaceholder")} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="ks-field">
          <label>{t("directory.ageGroup")}</label>
          <select value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)}>
            <option value="">{t("directory.any")}</option>
            {Array.from({ length: 19 }, (_, i) => (
              <option key={i} value={String(i)}>{i}</option>
            ))}
          </select>
        </div>
        <div className="ks-field">
          <label>{t("directory.day")}</label>
          <select value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
            <option value="">{t("directory.any")}</option>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button variant="hero" className="w-full" onClick={() => {}}>{t("directory.searchLabel")}</Button>
        </div>
      </div>

      {/* Meta pills */}
      {hasSearch && (
        <div className="flex gap-2.5 items-center flex-wrap mt-2.5 text-muted-foreground text-xs">
          <span className="ks-pill">
            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_0_4px_hsla(44,93%,57%,0.18)]" />
            {t("directory.showing")} <strong className="text-foreground">{filtered.length}</strong> {t("directory.of")} <strong className="text-foreground">{db.length}</strong>
          </span>
          <span className="ks-pill">{t("directory.searchBy")} <strong className="text-foreground">{t("directory.town")}</strong> {t("directory.or")} <strong className="text-foreground">{t("directory.postcodeDistrict")}</strong></span>
          <span className="ks-pill text-amber-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_0_4px_hsla(38,92%,50%,0.18)]" />
            {t("directory.ofstedPending")}
          </span>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">{t("directory.loading")}</div>
      ) : !hasSearch ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          {t("directory.searchBy")} <strong className="text-foreground">{t("directory.town")}</strong> {t("directory.or")} <strong className="text-foreground">{t("directory.postcodeDistrict")}</strong>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3.5">
          {filtered.length === 0 ? (
            <div className="ks-profile-card col-span-full">
              <div className="font-bold">{t("directory.noMatches")}</div>
              <div className="text-muted-foreground text-sm">{t("directory.noMatchesDesc")}</div>
              <div className="flex gap-2.5 flex-wrap mt-auto">
                <Button variant="ghost" size="sm" onClick={reset}>{t("directory.resetFilters")}</Button>
                <Button variant="hero" size="sm" asChild><a href="#contact">{t("directory.askHelp")}</a></Button>
              </div>
            </div>
          ) : (
            filtered.map((cm) => {
              const displayName = `${cm.firstName} ${cm.lastInitial}.`;
              const tags = [cm.postcodeDistrict, cm.town, cm.hours, ...cm.ageGroups.map((a) => `Ages ${a}`)].slice(0, 5);
              return (
                <div key={cm.id} className="ks-profile-card">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black tracking-tight">{displayName}</span>
                    <VerificationBadge tier={cm.verificationTier} size="sm" />
                  </div>
                  <div className="text-muted-foreground text-[13.5px]">
                    <strong>{cm.postcodeDistrict}</strong> • {cm.town}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {tags.map((tg, i) => (
                      <span key={i} className="ks-tag">{tg}</span>
                    ))}
                  </div>
                  <div className="flex gap-2.5 flex-wrap mt-auto">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCm(cm)}>{t("directory.viewProfile")}</Button>
                    <Button variant="hero" size="sm" asChild>
                      <a href={makeEnquiryMailto(cm)}>{t("directory.enquire")}</a>
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground/60">{t("directory.ref")}: <strong className="font-mono">{cm.id}</strong></div>
                </div>
              );
            })
          )}
        </div>
      )}

      <ProfileModal childminder={selectedCm} onClose={() => setSelectedCm(null)} />
    </section>
  );
};

export default DirectorySection;
