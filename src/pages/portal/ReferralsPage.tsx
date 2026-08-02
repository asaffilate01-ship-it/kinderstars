import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Gift, Copy, Loader2, CheckCircle2, Clock, Euro, Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { makeReferralCode, referralLink, REFERRAL_BOUNTIES, bountyLabel } from "@/lib/referrals";

interface Referral {
  id: string;
  referred_email: string | null;
  trigger_event: string;
  bounty_cents: number;
  status: string;
  qualified_at: string | null;
  paid_at: string | null;
  created_at: string;
}

const euro = (cents: number) => (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export default function ReferralsPage() {
  const { user } = useAuth();
  const [code, setCode] = useState<string>("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Ensure user has a referral code
    let { data: codeRow } = await supabase
      .from("referral_codes")
      .select("code")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!codeRow) {
      const generated = makeReferralCode(user.id);
      const { data: inserted } = await supabase
        .from("referral_codes")
        .insert({ user_id: user.id, code: generated })
        .select("code")
        .single();
      codeRow = inserted;
    }
    setCode(codeRow?.code ?? "");

    const { data: refs } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_user_id", user.id)
      .order("created_at", { ascending: false });
    setReferrals((refs ?? []) as Referral[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const link = code ? referralLink(code) : "";

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast({ title: "Link kopiert", description: "Ihr Empfehlungslink wurde in die Zwischenablage kopiert." });
  };

  const shareLink = async () => {
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "KinderStars — Ihre persönliche Empfehlung",
          text: "Registrieren Sie sich mit meinem Code und wir erhalten beide einen Vorteil.",
          url: link,
        });
      } catch { return; }
    } else {
      copyLink();
    }
  };

  const sendInvite = async () => {
    if (!user || !inviteEmail.trim()) return;
    const email = inviteEmail.trim().toLowerCase();
    const { error } = await supabase.from("referrals").insert({
      referrer_user_id: user.id,
      referred_email: email,
      code,
      trigger_event: "signup",
      bounty_cents: 0,
      status: "pending",
    });
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    setInviteEmail("");
    toast({ title: "Einladung gespeichert", description: `Wir tracken die Anmeldung von ${email}.` });
    fetchData();
  };

  const totalQualified = referrals
    .filter((r) => r.status === "qualified" || r.status === "paid")
    .reduce((sum, r) => sum + r.bounty_cents, 0);
  const totalPaid = referrals.filter((r) => r.status === "paid").reduce((sum, r) => sum + r.bounty_cents, 0);
  const totalPending = totalQualified - totalPaid;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-4">
        <Loader2 className="w-4 h-4 animate-spin" /> Empfehlungen werden geladen…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Gift className="w-6 h-6 text-primary" /> Empfehlungsprogramm
        </h1>
        <p className="text-muted-foreground text-sm">
          Empfehlen Sie KinderStars weiter und verdienen Sie eine Prämie, sobald Ihre Empfehlung aktiv wird.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Verdient (offen)</p>
          <p className="text-2xl font-bold text-primary">{euro(totalPending)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Ausgezahlt</p>
          <p className="text-2xl font-bold">{euro(totalPaid)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Empfehlungen gesamt</p>
          <p className="text-2xl font-bold">{referrals.length}</p>
        </Card>
      </div>

      <Card className="p-5 bg-primary/5 border-primary/20">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Share2 className="w-4 h-4" /> Ihr persönlicher Empfehlungslink
        </h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input readOnly value={link} className="font-mono text-sm bg-background" />
          <Button variant="outline" onClick={copyLink} className="gap-2">
            <Copy className="w-4 h-4" /> Kopieren
          </Button>
          <Button onClick={shareLink} className="gap-2">
            <Share2 className="w-4 h-4" /> Teilen
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Ihr Code: <span className="font-mono font-semibold">{code}</span>
        </p>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">So verdienen Sie</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <Euro className="w-4 h-4 text-primary mt-0.5" />
            <span><strong>{euro(REFERRAL_BOUNTIES.minder_verification_purchase)}</strong> — wenn eine empfohlene Kindertagespflegeperson KinderStars Verifiziert (€79) bucht.</span>
          </li>
          <li className="flex items-start gap-2">
            <Euro className="w-4 h-4 text-primary mt-0.5" />
            <span><strong>{euro(REFERRAL_BOUNTIES.parent_first_booking)}</strong> — wenn eine empfohlene Familie ihre erste bezahlte Betreuung abschließt.</span>
          </li>
          <li className="flex items-start gap-2 text-muted-foreground text-xs">
            <Clock className="w-4 h-4 mt-0.5" />
            <span>Auszahlung als Guthaben auf Ihre nächste Rechnung oder per SEPA am Monatsende, sobald der Betrag freigegeben ist.</span>
          </li>
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Direkt einladen</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            placeholder="freund@example.de"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            maxLength={255}
          />
          <Button onClick={sendInvite} disabled={!inviteEmail.trim()}>Einladung tracken</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Wir verknüpfen die Empfehlung mit dieser E-Mail, wenn sich die Person registriert.
        </p>
      </Card>

      <div>
        <h2 className="font-semibold mb-3">Ihre Empfehlungen</h2>
        {referrals.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Noch keine Empfehlungen. Teilen Sie Ihren Link!
          </Card>
        ) : (
          <div className="space-y-2">
            {referrals.map((r) => (
              <Card key={r.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.referred_email ?? "Anonyme Anmeldung"}</p>
                  <p className="text-xs text-muted-foreground">
                    {bountyLabel(r.trigger_event)} · {new Date(r.created_at).toLocaleDateString("de-DE")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold">{euro(r.bounty_cents)}</span>
                  {r.status === "paid" && (
                    <Badge variant="default" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Ausgezahlt</Badge>
                  )}
                  {r.status === "qualified" && <Badge variant="secondary">Freigegeben</Badge>}
                  {r.status === "pending" && <Badge variant="outline">Offen</Badge>}
                  {r.status === "rejected" && <Badge variant="destructive">Abgelehnt</Badge>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
