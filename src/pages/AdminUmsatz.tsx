import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatEUR, SUBSCRIPTION_PLANS, VERIFICATION_FEE, JUGENDAMT_READY, FIRST_AID } from "@/lib/pricing";
import { ArrowLeft, TrendingUp, ShieldCheck, GraduationCap, Landmark, HeartPulse, Building2 } from "lucide-react";

interface Metrics {
  activeSubs: number;
  mrrCents: number;
  verifiedCount: number;
  verificationRevenueCents: number;
  academyEnrollments: number;
  academyRevenueCents: number;
  referralClicks: number;
  jugendamtAssessments: number;
  jugendamtRevenueCents: number;
  firstAidBookings: number;
  firstAidRevenueCents: number;
  saasLeads: number;
  employerOrgs: number;
}

const EMPTY: Metrics = {
  activeSubs: 0, mrrCents: 0, verifiedCount: 0, verificationRevenueCents: 0,
  academyEnrollments: 0, academyRevenueCents: 0, referralClicks: 0,
  jugendamtAssessments: 0, jugendamtRevenueCents: 0,
  firstAidBookings: 0, firstAidRevenueCents: 0, saasLeads: 0, employerOrgs: 0,
};

const PROJECTION_ROWS = [
  { label: "KinderStars Verified (€79 einmalig)", perMinder: 79, note: "Bei 1.000 Kindertagespflegepersonen einmalig" },
  { label: "Compliance Plus (€14,99/Monat)", perMinder: 14.99 * 12, note: "40 % Konversion angenommen" },
  { label: "Professional Compliance (€29,99/Monat)", perMinder: 29.99 * 12, note: "15 % Konversion angenommen" },
  { label: "Akademie-Kurse (Ø €35 p.a.)", perMinder: 35, note: "Zusatzverkäufe" },
  { label: "Jugendamt-Ready (€149 einmalig)", perMinder: 149, note: "10 % Konversion angenommen" },
  { label: "Erste-Hilfe-Auffrischung (€69/2 Jahre)", perMinder: 34.5, note: "Jährlich amortisiert" },
];

export default function AdminUmsatz() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [m, setM] = useState<Metrics>(EMPTY);
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
    try {
      const [subs, ver, enr, ref, jr, fa, leads, emp] = await Promise.all([
        supabase.from("subscriptions").select("plan_id, status"),
        supabase.from("minder_verification").select("tier, verified_from"),
        supabase.from("academy_enrollments").select("price_cents_paid, status"),
        supabase.from("partner_referrals").select("id"),
        supabase.from("jugendamt_ready_assessments").select("status"),
        supabase.from("first_aid_bookings").select("price_cents_paid, status"),
        supabase.from("saas_leads").select("id"),
        supabase.from("employer_organisations").select("id, plan_tier"),
      ]);

      const activeSubs = (subs.data || []).filter((s: any) => s.status === "active");
      const mrrCents = activeSubs.reduce((acc: number, s: any) => {
        const plan = SUBSCRIPTION_PLANS.find(p => p.id === s.plan_id);
        return acc + (plan?.monthlyCents ?? 0);
      }, 0);

      const verifiedRows = (ver.data || []).filter((v: any) => v.tier !== "registered");
      const enrRows = (enr.data || []).filter((e: any) => e.status === "paid" || e.status === "completed" || e.status === "enrolled");
      const jrRows = (jr.data || []).filter((j: any) => j.status && j.status !== "cancelled");
      const faRows = (fa.data || []).filter((f: any) => f.status === "confirmed" || f.status === "attended");

      setM({
        activeSubs: activeSubs.length,
        mrrCents,
        verifiedCount: verifiedRows.length,
        verificationRevenueCents: verifiedRows.length * VERIFICATION_FEE.amountCents,
        academyEnrollments: enrRows.length,
        academyRevenueCents: enrRows.reduce((a: number, e: any) => a + (e.price_cents_paid ?? 0), 0),
        referralClicks: (ref.data || []).length,
        jugendamtAssessments: jrRows.length,
        jugendamtRevenueCents: jrRows.length * JUGENDAMT_READY.assessmentAmountCents,
        firstAidBookings: faRows.length,
        firstAidRevenueCents: faRows.reduce((a: number, f: any) => a + (f.price_cents_paid ?? FIRST_AID.seatPriceCents), 0),
        saasLeads: (leads.data || []).length,
        employerOrgs: (emp.data || []).length,
      });
    } finally {
      setBusy(false);
    }
  };

  const kpis = [
    { label: "MRR (Abos)", value: formatEUR(m.mrrCents), sub: `${m.activeSubs} aktive Abos`, icon: TrendingUp },
    { label: "Verifizierungen (€79)", value: formatEUR(m.verificationRevenueCents), sub: `${m.verifiedCount} verifiziert`, icon: ShieldCheck },
    { label: "Akademie-Umsatz", value: formatEUR(m.academyRevenueCents), sub: `${m.academyEnrollments} Einschreibungen`, icon: GraduationCap },
    { label: "Jugendamt Ready", value: formatEUR(m.jugendamtRevenueCents), sub: `${m.jugendamtAssessments} Assessments`, icon: Landmark },
    { label: "Erste Hilfe", value: formatEUR(m.firstAidRevenueCents), sub: `${m.firstAidBookings} Buchungen`, icon: HeartPulse },
    { label: "Arbeitgeber / SaaS", value: `${m.employerOrgs} / ${m.saasLeads}`, sub: "Orgs / Demo-Leads", icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/admin/dashboard" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Admin
            </Link>
            <h1 className="text-3xl font-bold mt-2">Umsatz & Reporting</h1>
            <p className="text-muted-foreground">Aktuelle Umsätze aus Abos, Verifizierung, Akademie, Jugendamt-Ready, Erste Hilfe und B2B.</p>
          </div>
          <Button variant="outline" onClick={load} disabled={busy}>{busy ? "Lade…" : "Aktualisieren"}</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kpis.map(k => {
            const Icon = k.icon;
            return (
              <Card key={k.label}>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm text-muted-foreground">{k.label}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{k.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Referral-Pipeline (Partnerkurse)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {m.referralClicks} verfolgte Klicks auf externe Partnerangebote (Erste Hilfe, QHB, Sprache, Steuer, Versicherung).
              Kommissionen werden manuell nach Abrechnung durch die Partner erfasst.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Beispielprojektion — 1.000 Kindertagespflegepersonen</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produkt</TableHead>
                  <TableHead className="text-right">Ø pro Person / Jahr</TableHead>
                  <TableHead className="text-right">Bei 1.000 Personen</TableHead>
                  <TableHead>Hinweis</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PROJECTION_ROWS.map(r => (
                  <TableRow key={r.label}>
                    <TableCell className="font-medium">{r.label}</TableCell>
                    <TableCell className="text-right">{formatEUR(Math.round(r.perMinder * 100))}</TableCell>
                    <TableCell className="text-right">{formatEUR(Math.round(r.perMinder * 100 * 1000))}</TableCell>
                    <TableCell className="text-muted-foreground">{r.note}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground mt-4">
              Illustrative Werte auf Basis der Preisliste. Reale Konversionsraten variieren je nach Region, Reifegrad und Marketing-Mix.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}