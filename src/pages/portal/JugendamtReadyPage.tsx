import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatEUR, JUGENDAMT_READY } from "@/lib/pricing";
import { CheckCircle2, Circle, AlertTriangle, ShieldCheck, FileText, Calendar, FolderOpen, GraduationCap, Loader2 } from "lucide-react";

type Status = "ordered" | "in_review" | "action_required" | "ready" | "submitted" | "completed" | "cancelled";
type MonitorTier = "none" | "basic" | "pro";

interface Assessment {
  id: string;
  status: Status;
  bundesland: string | null;
  jugendamt_name: string | null;
  qualifications_review: { status: string; notes: string };
  missing_documents: Array<{ label: string; done: boolean }>;
  training_pathway: Array<{ label: string; done: boolean }>;
  application_pack: { status: string; files: string[] };
  appointment_prep: { status: string; notes: string };
  evidence_folder: { status: string; files: string[] };
  reviewer_notes: string | null;
  minder_notes: string | null;
  monitoring_tier: MonitorTier;
  monitoring_active_until: string | null;
  ordered_at: string;
  completed_at: string | null;
}

const STATUS_LABELS: Record<Status, string> = {
  ordered: "Bestellt",
  in_review: "In Prüfung",
  action_required: "Handlung erforderlich",
  ready: "Bereit zur Einreichung",
  submitted: "Eingereicht",
  completed: "Abgeschlossen",
  cancelled: "Abgebrochen",
};

const STATUS_VARIANT: Record<Status, "default" | "secondary" | "destructive" | "outline"> = {
  ordered: "secondary",
  in_review: "secondary",
  action_required: "destructive",
  ready: "default",
  submitted: "default",
  completed: "default",
  cancelled: "outline",
};

const CHECKLIST_SECTIONS = [
  { key: "qualifications_review", title: "Qualifikationsprüfung", icon: GraduationCap, desc: "Abgleich Ihrer bisherigen Qualifikationen mit den Anforderungen Ihres Jugendamts." },
  { key: "missing_documents", title: "Fehlende Dokumente", icon: FileText, desc: "Vollständige Liste der Dokumente, die Ihr Jugendamt für die Pflegeerlaubnis benötigt." },
  { key: "training_pathway", title: "Fortbildungspfad", icon: GraduationCap, desc: "Empfohlener Weg zur Qualifizierung (z. B. 160-Stunden-Grundkurs, QHB)." },
  { key: "application_pack", title: "Antragspaket", icon: FolderOpen, desc: "Zusammengestellte, geprüfte Antragsunterlagen." },
  { key: "appointment_prep", title: "Termin-Vorbereitung", icon: Calendar, desc: "Vorbereitung auf das Erstgespräch und die Hausbegehung." },
  { key: "evidence_folder", title: "Nachweisordner", icon: FolderOpen, desc: "Digitaler Ordner mit allen Belegen für Ihr Jugendamt-Gespräch." },
] as const;

export default function JugendamtReadyPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("jugendamt_ready_assessments")
        .select("*")
        .eq("user_id", user.id)
        .order("ordered_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setAssessment((data as unknown as Assessment) ?? null);
      setLoading(false);
    })();
  }, [user]);

  const order = async () => {
    if (!user) return;
    setOrdering(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { price_key: "jugendamt_ready_assessment", mode: "payment" },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        toast.info("Zahlungsanbieter noch nicht aktiviert. Bitte kontaktieren Sie uns.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Bestellung fehlgeschlagen");
    } finally {
      setOrdering(false);
    }
  };

  const subscribeMonitoring = async (tier: "basic" | "pro") => {
    const priceKey = tier === "basic" ? "jugendamt_ready_monitor_basic" : "jugendamt_ready_monitor_pro";
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { price_key: priceKey },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error(e?.message || "Abo-Start fehlgeschlagen");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold">Jugendamt Ready</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Strukturierte Vorbereitung auf die Antragstellung einer Pflegeerlaubnis nach § 43 SGB VIII bei Ihrem örtlichen Jugendamt.
        </p>
      </div>

      <div className="ks-card p-4 bg-amber-50 border-amber-200 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-medium mb-1">Wichtiger Hinweis</p>
          <p>KinderStars stellt <strong>keine Jugendamt-Anerkennung</strong> aus. Die Pflegeerlaubnis wird ausschließlich durch das zuständige Jugendamt erteilt. Wir bereiten Sie strukturiert vor und stellen Unterlagen zusammen — die Entscheidung trifft Ihr Jugendamt.</p>
        </div>
      </div>

      {!assessment ? (
        <>
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">Jugendamt-Ready Erstassessment</h2>
                <p className="text-sm text-muted-foreground max-w-xl">Einmalige, strukturierte Vorbereitung inkl. Qualifikationsprüfung, Dokumentencheck, Antragspaket und Termin-Vorbereitung.</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{formatEUR(JUGENDAMT_READY.assessmentAmountCents)}</div>
                <div className="text-xs text-muted-foreground">einmalig, inkl. MwSt.</div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-2 mt-4">
              {CHECKLIST_SECTIONS.map((s) => (
                <div key={s.key} className="flex items-start gap-2 text-sm">
                  <s.icon className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <div><span className="font-medium">{s.title}</span> — <span className="text-muted-foreground">{s.desc}</span></div>
                </div>
              ))}
            </div>
            <Button size="lg" className="mt-6" onClick={order} disabled={ordering}>
              {ordering ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Jugendamt-Ready für {formatEUR(JUGENDAMT_READY.assessmentAmountCents)} bestellen
            </Button>
          </Card>
        </>
      ) : (
        <>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                <Badge variant={STATUS_VARIANT[assessment.status]} className="mt-1 text-sm">{STATUS_LABELS[assessment.status]}</Badge>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>Bestellt: {new Date(assessment.ordered_at).toLocaleDateString("de-DE")}</div>
                {assessment.jugendamt_name && <div>Jugendamt: {assessment.jugendamt_name}</div>}
              </div>
            </div>
            {assessment.reviewer_notes && (
              <div className="p-3 rounded-lg bg-muted text-sm mb-2"><span className="font-medium">Prüfer-Notiz:</span> {assessment.reviewer_notes}</div>
            )}
          </Card>

          <div className="grid md:grid-cols-2 gap-3">
            {CHECKLIST_SECTIONS.map((s) => {
              const raw = (assessment as any)[s.key];
              let done = false;
              let detail = "";
              if (Array.isArray(raw)) {
                const total = raw.length;
                const doneCount = raw.filter((r: any) => r.done).length;
                done = total > 0 && doneCount === total;
                detail = total > 0 ? `${doneCount}/${total} erledigt` : "Noch nicht befüllt";
              } else if (raw && typeof raw === "object") {
                done = raw.status === "complete" || raw.status === "ready";
                detail = raw.status ? `Status: ${raw.status}` : "";
              }
              return (
                <Card key={s.key} className="p-4">
                  <div className="flex items-start gap-3">
                    {done ? <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> : <Circle className="w-5 h-5 text-muted-foreground shrink-0" />}
                    <div className="flex-1">
                      <p className="font-medium">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                      {detail && <p className="text-xs mt-1 text-muted-foreground">{detail}</p>}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-1">Laufende Betreuung</h3>
            <p className="text-sm text-muted-foreground mb-4">Optionales Monatsabo: Erinnerungen, Dokumenten-Refresh und laufender Support nach Erteilung der Pflegeerlaubnis.</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="ks-card p-4">
                <div className="flex items-baseline justify-between mb-1">
                  <p className="font-medium">Basic-Monitoring</p>
                  <p className="font-bold">{formatEUR(JUGENDAMT_READY.monitoringBasicMonthlyCents, { withPeriod: "month" })}</p>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 mb-3 list-disc list-inside">
                  <li>Ablauferinnerungen für Dokumente</li>
                  <li>Jährliche Compliance-Auffrischung</li>
                </ul>
                <Button variant="outline" size="sm" className="w-full" onClick={() => subscribeMonitoring("basic")} disabled={assessment.monitoring_tier === "basic"}>
                  {assessment.monitoring_tier === "basic" ? "Aktiv" : "Abonnieren"}
                </Button>
              </div>
              <div className="ks-card p-4 border-primary/30">
                <div className="flex items-baseline justify-between mb-1">
                  <p className="font-medium">Pro-Monitoring</p>
                  <p className="font-bold">{formatEUR(JUGENDAMT_READY.monitoringProMonthlyCents, { withPeriod: "month" })}</p>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 mb-3 list-disc list-inside">
                  <li>Alles aus Basic</li>
                  <li>Priorisierte Prüfer-Antworten</li>
                  <li>Jährliche Vor-Ort-Simulation</li>
                </ul>
                <Button size="sm" className="w-full" onClick={() => subscribeMonitoring("pro")} disabled={assessment.monitoring_tier === "pro"}>
                  {assessment.monitoring_tier === "pro" ? "Aktiv" : "Abonnieren"}
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}