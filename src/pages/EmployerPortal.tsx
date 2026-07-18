import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { formatEUR } from "@/lib/pricing";
import { Building2, Users, FileText, LogOut } from "lucide-react";

interface Organisation {
  id: string;
  company_name: string;
  contact_person: string | null;
  contact_email: string;
  contact_phone: string | null;
  tier: "starter" | "growth" | "enterprise";
  seat_count: number;
  postal_code: string | null;
  city: string | null;
  tax_id: string | null;
  vat_id: string | null;
  notes: string | null;
}

interface MinderLink {
  id: string;
  minder_user_id: string;
  employee_name: string | null;
  employee_email: string | null;
  subsidy_cents: number;
  monthly_hour_cap: number | null;
  status: "pending" | "active" | "paused" | "ended";
  funding_note: string | null;
  started_on: string | null;
}

const TIER_LABEL: Record<string, string> = {
  starter: "Starter (€199/Monat)",
  growth: "Growth (€499/Monat)",
  enterprise: "Enterprise (€999/Monat)",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Ausstehend",
  active: "Aktiv",
  paused: "Pausiert",
  ended: "Beendet",
};

export default function EmployerPortal() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [org, setOrg] = useState<Organisation | null>(null);
  const [links, setLinks] = useState<MinderLink[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [setupOpen, setSetupOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  // Setup form
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [vatId, setVatId] = useState("");

  // Link form
  const [minderUserId, setMinderUserId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [subsidyEuros, setSubsidyEuros] = useState("");
  const [hourCap, setHourCap] = useState("");
  const [fundingNote, setFundingNote] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    void loadData();
     
  }, [loading, user]);

  const loadData = async () => {
    if (!user) return;
    setDataLoading(true);
    const { data: orgs } = await supabase
      .from("employer_organisations")
      .select("*")
      .eq("owner_user_id", user.id)
      .maybeSingle();
    setOrg(orgs as Organisation | null);

    if (orgs) {
      const { data: ls } = await supabase
        .from("employer_minder_links")
        .select("*")
        .eq("employer_id", orgs.id)
        .order("created_at", { ascending: false });
      setLinks((ls ?? []) as MinderLink[]);
    }
    setDataLoading(false);
  };

  const createOrg = async () => {
    if (!user || !companyName.trim()) {
      toast.error("Firmenname erforderlich");
      return;
    }
    const { error } = await supabase.from("employer_organisations").insert({
      owner_user_id: user.id,
      company_name: companyName.trim(),
      contact_person: contactPerson.trim() || null,
      contact_email: user.email ?? "",
      contact_phone: contactPhone.trim() || null,
      postal_code: postalCode.trim() || null,
      city: city.trim() || null,
      vat_id: vatId.trim() || null,
      tier: "starter",
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Firmenkonto erstellt");
    setSetupOpen(false);
    void loadData();
  };

  const addLink = async () => {
    if (!org || !minderUserId.trim()) {
      toast.error("Betreuungsperson-ID erforderlich");
      return;
    }
    const subsidyCents = Math.round(parseFloat(subsidyEuros || "0") * 100);
    const { error } = await supabase.from("employer_minder_links").insert({
      employer_id: org.id,
      minder_user_id: minderUserId.trim(),
      employee_name: employeeName.trim() || null,
      employee_email: employeeEmail.trim() || null,
      subsidy_cents: isFinite(subsidyCents) ? subsidyCents : 0,
      monthly_hour_cap: hourCap ? parseInt(hourCap, 10) : null,
      funding_note: fundingNote.trim() || null,
      status: "pending",
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Betreuungsperson verknüpft");
    setLinkOpen(false);
    setMinderUserId("");
    setEmployeeName("");
    setEmployeeEmail("");
    setSubsidyEuros("");
    setHourCap("");
    setFundingNote("");
    void loadData();
  };

  const totalMonthlySubsidy = links
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + l.subsidy_cents, 0);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Lade Firmenkonto…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl flex-1">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Arbeitgeber-Portal</h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre Betreuungs-Benefits & Compliance-Übersicht.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            <LogOut className="h-4 w-4 mr-2" /> Abmelden
          </Button>
        </div>

        {!org ? (
          <Card>
            <CardHeader>
              <CardTitle>Firmenkonto einrichten</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Legen Sie in wenigen Schritten Ihr Firmenkonto an und verwalten Sie
                anschließend Zuschüsse, Mitarbeitende und Compliance-Reports.
              </p>
              <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
                <DialogTrigger asChild>
                  <Button>Firmenkonto anlegen</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Firmendaten</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Firmenname *</Label>
                      <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                    </div>
                    <div>
                      <Label>Ansprechpartner:in</Label>
                      <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
                    </div>
                    <div>
                      <Label>Telefon</Label>
                      <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>PLZ</Label>
                        <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <Label>Stadt</Label>
                        <Input value={city} onChange={(e) => setCity(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label>USt-IdNr.</Label>
                      <Input value={vatId} onChange={(e) => setVatId(e.target.value)} placeholder="DE123456789" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={createOrg}>Speichern</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Building2 className="h-4 w-4" /> Firma
                  </div>
                  <p className="text-lg font-semibold mt-1">{org.company_name}</p>
                  <Badge variant="secondary" className="mt-2">{TIER_LABEL[org.tier]}</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Users className="h-4 w-4" /> Verknüpfte Betreuungen
                  </div>
                  <p className="text-2xl font-bold mt-1">{links.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {links.filter((l) => l.status === "active").length} aktiv
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <FileText className="h-4 w-4" /> Monatliche Zuschüsse (aktiv)
                  </div>
                  <p className="text-2xl font-bold mt-1">{formatEUR(totalMonthlySubsidy)}</p>
                  <p className="text-xs text-muted-foreground">§ 3 Nr. 33 EStG-fähig</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Compliance-Matrix</CardTitle>
                <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">Betreuungsperson verknüpfen</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Betreuungsperson verknüpfen</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label>KinderStars-User-ID der Betreuungsperson *</Label>
                        <Input value={minderUserId} onChange={(e) => setMinderUserId(e.target.value)} placeholder="UUID" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Die Betreuungsperson muss ein KinderStars-Konto haben und Ihnen die ID bereitstellen.
                        </p>
                      </div>
                      <div>
                        <Label>Mitarbeitende:r (Name)</Label>
                        <Input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} />
                      </div>
                      <div>
                        <Label>E-Mail Mitarbeitende:r</Label>
                        <Input type="email" value={employeeEmail} onChange={(e) => setEmployeeEmail(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Monatlicher Zuschuss (€)</Label>
                          <Input type="number" min="0" step="0.01" value={subsidyEuros} onChange={(e) => setSubsidyEuros(e.target.value)} />
                        </div>
                        <div>
                          <Label>Stundenlimit / Monat</Label>
                          <Input type="number" min="0" value={hourCap} onChange={(e) => setHourCap(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <Label>Notiz zur Finanzierung</Label>
                        <Textarea value={fundingNote} onChange={(e) => setFundingNote(e.target.value)} rows={2} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={addLink}>Verknüpfen</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {links.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Noch keine Betreuungspersonen verknüpft.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mitarbeitende:r</TableHead>
                        <TableHead>Zuschuss</TableHead>
                        <TableHead>Stunden/Monat</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {links.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell>
                            <div className="font-medium">{l.employee_name ?? "—"}</div>
                            <div className="text-xs text-muted-foreground">{l.employee_email ?? ""}</div>
                          </TableCell>
                          <TableCell>{formatEUR(l.subsidy_cents)}</TableCell>
                          <TableCell>{l.monthly_hour_cap ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant={l.status === "active" ? "default" : "secondary"}>
                              {STATUS_LABEL[l.status]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <p className="text-xs text-muted-foreground mt-4">
                  Hinweis: KinderStars ist ein lizenzierter Marktplatz (§ 296 SGB III).
                  Zuschüsse können nach § 3 Nr. 33 EStG steuerfrei sein — bitte individuell prüfen.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
