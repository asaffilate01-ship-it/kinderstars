import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck, ShieldAlert, Building2, Landmark, GraduationCap } from "lucide-react";

type VerificationRow = {
  id: string;
  user_id: string;
  tier: "registered" | "verified" | "jugendamt_approved";
  verified_from: string | null;
  verified_until: string | null;
  jugendamt_confirmed: boolean | null;
  jugendamt_confirmation_ref: string | null;
  created_at: string;
};

type SafeguardingRow = {
  id: string;
  child_initials: string;
  category: string;
  severity: string;
  status: string;
  jugendamt_notified: boolean;
  occurred_at: string;
  created_at: string;
};

type SaasLeadRow = {
  id: string;
  organisation_name: string;
  contact_email: string;
  org_type: string;
  tier: string | null;
  status: string;
  seats_estimate: number | null;
  created_at: string;
};

type EmployerRow = {
  id: string;
  name: string;
  plan_tier: string | null;
  billing_email: string | null;
  created_at: string;
};

type JugendamtReadyRow = {
  id: string;
  user_id: string;
  status: string;
  score: number | null;
  created_at: string;
};

const SEVERITY_COLOR: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function AdminOversight() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [verifications, setVerifications] = useState<VerificationRow[]>([]);
  const [safeguarding, setSafeguarding] = useState<SafeguardingRow[]>([]);
  const [saasLeads, setSaasLeads] = useState<SaasLeadRow[]>([]);
  const [employers, setEmployers] = useState<EmployerRow[]>([]);
  const [jugendamtReady, setJugendamtReady] = useState<JugendamtReadyRow[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || (userRole !== "admin" && userRole !== "owner")) {
      navigate("/admin/login", { replace: true });
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, userRole]);

  const load = async () => {
    setBusy(true);
    const [ver, sg, leads, emp, jr] = await Promise.all([
      supabase.from("minder_verification").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("safeguarding_concerns").select("id, child_initials, category, severity, status, jugendamt_notified, occurred_at, created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("saas_leads").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("employer_organisations").select("id, name, plan_tier, billing_email, created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("jugendamt_ready_assessments").select("id, user_id, status, score, created_at").order("created_at", { ascending: false }).limit(100),
    ]);
    setVerifications((ver.data as VerificationRow[]) || []);
    setSafeguarding((sg.data as SafeguardingRow[]) || []);
    setSaasLeads((leads.data as SaasLeadRow[]) || []);
    setEmployers((emp.data as EmployerRow[]) || []);
    setJugendamtReady((jr.data as JugendamtReadyRow[]) || []);
    setBusy(false);
  };

  const setTier = async (id: string, tier: VerificationRow["tier"]) => {
    const patch: Partial<VerificationRow> = { tier };
    if (tier === "verified") {
      patch.verified_from = new Date().toISOString();
      const until = new Date();
      until.setFullYear(until.getFullYear() + 1);
      patch.verified_until = until.toISOString();
    }
    const { error } = await supabase.from("minder_verification").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Verifizierungsstufe aktualisiert.");
    void load();
  };

  const updateLead = async (id: string, status: string) => {
    const { error } = await supabase.from("saas_leads").update({ status: status as any }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Lead-Status aktualisiert.");
    void load();
  };

  const updateSafeguarding = async (id: string, patch: Partial<SafeguardingRow>) => {
    const { error } = await supabase.from("safeguarding_concerns").update(patch as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Kinderschutz-Fall aktualisiert.");
    void load();
  };

  const pendingVerified = verifications.filter(v => v.tier === "registered").length;
  const openSafeguarding = safeguarding.filter(s => s.status === "open" || s.status === "in_review").length;
  const newLeads = saasLeads.filter(l => l.status === "new").length;

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <Link to="/admin/dashboard" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Admin
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-3xl font-bold">Super-Admin Übersicht</h1>
              <p className="text-muted-foreground">Verifizierungen, Kinderschutz, B2B-Pipeline und Jugendamt-Ready an einem Ort.</p>
            </div>
            <Button variant="outline" onClick={load} disabled={busy}>{busy ? "Lade…" : "Aktualisieren"}</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs text-muted-foreground">Verifizierung offen</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{pendingVerified}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs text-muted-foreground">Kinderschutz offen</CardTitle>
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{openSafeguarding}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs text-muted-foreground">Neue SaaS-Leads</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{newLeads}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs text-muted-foreground">Arbeitgeber</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{employers.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs text-muted-foreground">Jugendamt-Ready</CardTitle>
              <Landmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{jugendamtReady.length}</div></CardContent>
          </Card>
        </div>

        <Tabs defaultValue="verifications">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
            <TabsTrigger value="verifications">Verifizierung</TabsTrigger>
            <TabsTrigger value="safeguarding">Kinderschutz</TabsTrigger>
            <TabsTrigger value="saas">SaaS-Leads</TabsTrigger>
            <TabsTrigger value="employers">Arbeitgeber</TabsTrigger>
            <TabsTrigger value="jugendamt">Jugendamt-Ready</TabsTrigger>
          </TabsList>

          <TabsContent value="verifications">
            <Card>
              <CardHeader>
                <CardTitle>Verifizierungs-Queue</CardTitle>
                <CardDescription>Kindertagespflegepersonen und ihre aktuelle Stufe.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Stufe</TableHead>
                      <TableHead>Gültig bis</TableHead>
                      <TableHead>Jugendamt Ref.</TableHead>
                      <TableHead className="text-right">Aktion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verifications.map(v => (
                      <TableRow key={v.id}>
                        <TableCell className="font-mono text-xs">{v.user_id.slice(0, 8)}…</TableCell>
                        <TableCell><Badge variant={v.tier === "registered" ? "outline" : "default"}>{v.tier}</Badge></TableCell>
                        <TableCell>{v.verified_until ? new Date(v.verified_until).toLocaleDateString("de-DE") : "—"}</TableCell>
                        <TableCell className="text-xs">{v.jugendamt_confirmation_ref || "—"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          {v.tier !== "verified" && (
                            <Button size="sm" variant="outline" onClick={() => setTier(v.id, "verified")}>Verified</Button>
                          )}
                          {v.tier !== "registered" && (
                            <Button size="sm" variant="ghost" onClick={() => setTier(v.id, "registered")}>Zurücksetzen</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {verifications.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Keine Einträge.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="safeguarding">
            <Card>
              <CardHeader>
                <CardTitle>Kinderschutz-Meldungen</CardTitle>
                <CardDescription>§ 8a SGB VIII — offene und laufende Fälle.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kind</TableHead>
                      <TableHead>Kategorie</TableHead>
                      <TableHead>Schweregrad</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead className="text-right">Aktion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeguarding.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.child_initials}</TableCell>
                        <TableCell className="text-xs">{s.category}</TableCell>
                        <TableCell><Badge className={SEVERITY_COLOR[s.severity]}>{s.severity}</Badge></TableCell>
                        <TableCell><Badge variant="outline">{s.status}</Badge></TableCell>
                        <TableCell className="text-xs">{new Date(s.occurred_at).toLocaleDateString("de-DE")}</TableCell>
                        <TableCell className="text-right space-x-2">
                          {s.status === "open" && <Button size="sm" variant="outline" onClick={() => updateSafeguarding(s.id, { status: "in_review" })}>Prüfen</Button>}
                          {!s.jugendamt_notified && <Button size="sm" variant="outline" onClick={() => updateSafeguarding(s.id, { jugendamt_notified: true, status: "jugendamt_notified" })}>Jugendamt</Button>}
                          {s.status !== "closed" && <Button size="sm" variant="ghost" onClick={() => updateSafeguarding(s.id, { status: "closed" })}>Schließen</Button>}
                        </TableCell>
                      </TableRow>
                    ))}
                    {safeguarding.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Keine Meldungen.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saas">
            <Card>
              <CardHeader>
                <CardTitle>SaaS-Leads</CardTitle>
                <CardDescription>White-Label Demo-Anfragen von Trägern und Kommunen.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organisation</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Plätze</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aktion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {saasLeads.map(l => (
                      <TableRow key={l.id}>
                        <TableCell>
                          <div className="font-medium">{l.organisation_name}</div>
                          <div className="text-xs text-muted-foreground">{l.contact_email}</div>
                        </TableCell>
                        <TableCell className="text-xs">{l.org_type}</TableCell>
                        <TableCell>{l.seats_estimate || "—"}</TableCell>
                        <TableCell className="text-xs">{l.tier || "—"}</TableCell>
                        <TableCell><Badge variant="outline">{l.status}</Badge></TableCell>
                        <TableCell className="text-right space-x-2">
                          {l.status === "new" && <Button size="sm" variant="outline" onClick={() => updateLead(l.id, "contacted")}>Kontaktiert</Button>}
                          {l.status !== "won" && l.status !== "lost" && <Button size="sm" variant="outline" onClick={() => updateLead(l.id, "won")}>Gewonnen</Button>}
                        </TableCell>
                      </TableRow>
                    ))}
                    {saasLeads.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Keine Leads.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employers">
            <Card>
              <CardHeader>
                <CardTitle>Arbeitgeber</CardTitle>
                <CardDescription>Registrierte B2B-Organisationen (§ 3 Nr. 33 EStG).</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Firma</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Kontakt</TableHead>
                      <TableHead>Seit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employers.map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.name}</TableCell>
                        <TableCell><Badge variant="outline">{e.plan_tier || "—"}</Badge></TableCell>
                        <TableCell className="text-xs">{e.billing_email || "—"}</TableCell>
                        <TableCell className="text-xs">{new Date(e.created_at).toLocaleDateString("de-DE")}</TableCell>
                      </TableRow>
                    ))}
                    {employers.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Keine Arbeitgeber.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jugendamt">
            <Card>
              <CardHeader>
                <CardTitle>Jugendamt-Ready Assessments</CardTitle>
                <CardDescription>Fortschritt der Kandidat:innen im Pflegeerlaubnis-Prozess (§ 43 SGB VIII).</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Erstellt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jugendamtReady.map(j => (
                      <TableRow key={j.id}>
                        <TableCell className="font-mono text-xs">{j.user_id.slice(0, 8)}…</TableCell>
                        <TableCell><Badge variant="outline">{j.status}</Badge></TableCell>
                        <TableCell>{j.score ?? "—"}</TableCell>
                        <TableCell className="text-xs">{new Date(j.created_at).toLocaleDateString("de-DE")}</TableCell>
                      </TableRow>
                    ))}
                    {jugendamtReady.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Keine Assessments.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Weitere Admin-Bereiche</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/admin/umsatz">Umsatz & Reporting</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/admin/roster">Roster</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/admin/create-user">Nutzer anlegen</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/admin">Kindertagespflegepersonen-Verzeichnis</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}