import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Euro, Users, Building2, ShieldAlert } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { bountyLabel } from "@/lib/referrals";

const euro = (cents: number) => (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

interface Row { id: string; referrer_user_id: string; referred_email: string | null; trigger_event: string; bounty_cents: number; status: string; created_at: string; }
interface Kita { id: string; name: string; town: string | null; contact_email: string | null; status: string; created_at: string; }
interface KitaRef { id: string; kita_partner_id: string; parent_email: string | null; status: string; commission_cents: number; created_at: string; }
interface InsuranceRow { user_id: string; insurance_provider: string | null; insurance_expiry: string | null; status: string; grace_until: string | null; }

export default function AdminReferrals() {
  const [tab, setTab] = useState<"referrals" | "kita" | "insurance">("referrals");
  const [referrals, setReferrals] = useState<Row[]>([]);
  const [kitas, setKitas] = useState<Kita[]>([]);
  const [kitaRefs, setKitaRefs] = useState<KitaRef[]>([]);
  const [insurance, setInsurance] = useState<InsuranceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [r, k, kr, ins] = await Promise.all([
      supabase.from("referrals").select("*").order("created_at", { ascending: false }),
      supabase.from("kita_partners").select("*").order("created_at", { ascending: false }),
      supabase.from("kita_referrals").select("*").order("created_at", { ascending: false }),
      supabase.from("v_childminder_insurance_status").select("*").in("status", ["expired", "grace", "missing"]),
    ]);
    setReferrals((r.data ?? []) as Row[]);
    setKitas((k.data ?? []) as Kita[]);
    setKitaRefs((kr.data ?? []) as KitaRef[]);
    setInsurance((ins.data ?? []) as InsuranceRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === "paid") patch.paid_at = new Date().toISOString();
    if (status === "qualified") patch.qualified_at = new Date().toISOString();
    const { error } = await supabase.from("referrals").update(patch).eq("id", id);
    if (error) toast({ title: "Fehler", description: error.message, variant: "destructive" });
    else load();
  };

  const setKitaStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("kita_partners").update({ status }).eq("id", id);
    if (error) toast({ title: "Fehler", description: error.message, variant: "destructive" });
    else load();
  };

  const totalPending = referrals.filter(r => r.status === "qualified").reduce((s, r) => s + r.bounty_cents, 0);
  const totalPaid = referrals.filter(r => r.status === "paid").reduce((s, r) => s + r.bounty_cents, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Empfehlungen & Partner</h1>

        <div className="grid gap-3 md:grid-cols-4 mb-6">
          <Card className="p-4"><p className="text-xs text-muted-foreground">Empfehlungen</p><p className="text-2xl font-bold">{referrals.length}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Auszuzahlen</p><p className="text-2xl font-bold text-primary">{euro(totalPending)}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Ausgezahlt</p><p className="text-2xl font-bold">{euro(totalPaid)}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Kita-Partner</p><p className="text-2xl font-bold">{kitas.length}</p></Card>
        </div>

        <div className="flex gap-2 mb-4">
          <Button variant={tab === "referrals" ? "default" : "outline"} onClick={() => setTab("referrals")} size="sm"><Users className="w-4 h-4 mr-1" /> Empfehlungen</Button>
          <Button variant={tab === "kita" ? "default" : "outline"} onClick={() => setTab("kita")} size="sm"><Building2 className="w-4 h-4 mr-1" /> Kita-Partner</Button>
          <Button variant={tab === "insurance" ? "default" : "outline"} onClick={() => setTab("insurance")} size="sm"><ShieldAlert className="w-4 h-4 mr-1" /> Haftpflicht-Warnungen</Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground p-6"><Loader2 className="w-4 h-4 animate-spin" /> Wird geladen…</div>
        ) : tab === "referrals" ? (
          <div className="space-y-2">
            {referrals.length === 0 && <Card className="p-6 text-sm text-muted-foreground text-center">Noch keine Empfehlungen.</Card>}
            {referrals.map(r => (
              <Card key={r.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.referred_email ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{bountyLabel(r.trigger_event)} · {new Date(r.created_at).toLocaleDateString("de-DE")}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold flex items-center gap-1"><Euro className="w-3 h-3" />{euro(r.bounty_cents)}</span>
                  <Badge variant={r.status === "paid" ? "default" : r.status === "qualified" ? "secondary" : r.status === "rejected" ? "destructive" : "outline"}>{r.status}</Badge>
                  {r.status === "pending" && <>
                    <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "qualified")}>Freigeben</Button>
                    <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "rejected")}>Ablehnen</Button>
                  </>}
                  {r.status === "qualified" && <Button size="sm" onClick={() => setStatus(r.id, "paid")}>Auszahlen</Button>}
                </div>
              </Card>
            ))}
          </div>
        ) : tab === "kita" ? (
          <div className="space-y-2">
            {kitas.length === 0 && <Card className="p-6 text-sm text-muted-foreground text-center">Noch keine Kita-Partner.</Card>}
            {kitas.map(k => {
              const refs = kitaRefs.filter(kr => kr.kita_partner_id === k.id);
              return (
                <Card key={k.id} className="p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-semibold">{k.name}</p>
                      <p className="text-xs text-muted-foreground">{k.town ?? "—"} · {k.contact_email}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant={k.status === "active" ? "default" : "outline"}>{k.status}</Badge>
                      {k.status === "lead" && <Button size="sm" onClick={() => setKitaStatus(k.id, "active")}>Aktivieren</Button>}
                      {k.status === "active" && <Button size="sm" variant="outline" onClick={() => setKitaStatus(k.id, "inactive")}>Deaktivieren</Button>}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{refs.length} Familien-Vermittlungen</p>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {insurance.length === 0 && <Card className="p-6 text-sm text-muted-foreground text-center">Alle Minder haben gültige Berufshaftpflicht.</Card>}
            {insurance.map(i => (
              <Card key={i.user_id} className="p-4 flex justify-between items-center gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{i.insurance_provider ?? "Kein Anbieter hinterlegt"}</p>
                  <p className="text-xs text-muted-foreground font-mono">User {i.user_id.slice(0, 8)}… · Ablauf {i.insurance_expiry ?? "—"}</p>
                </div>
                <Badge variant={i.status === "expired" ? "destructive" : i.status === "missing" ? "destructive" : "secondary"}>
                  {i.status === "grace" ? `Kulanz bis ${i.grace_until}` : i.status}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}