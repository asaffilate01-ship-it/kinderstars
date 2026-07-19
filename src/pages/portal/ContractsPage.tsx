import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { escapeHtml } from "@/lib/html-utils";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Printer, Mail, Loader2, Plus, ArrowLeft, Eye, Trash2, CheckCircle, Clock, XCircle, PenLine, CalendarIcon, UserCheck } from "lucide-react";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import SignaturePad from "@/components/SignaturePad";
import {
  ContractType, ContractData, CONTRACT_TYPES, defaultContractData, getContractClauses,
} from "@/lib/contract-clauses";

interface SavedContract {
  id: string;
  contract_type: string;
  status: string;
  parent_name: string | null;
  parent_email: string | null;
  child_name: string | null;
  childminder_name: string | null;
  start_date: string | null;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  signed_by_parent: boolean | null;
  signed_by_agency: boolean | null;
  parent_signature_data: string | null;
  parent_signature_type: string | null;
  agency_signature_data: string | null;
  agency_signature_type: string | null;
  payment_source: string | null;
}

interface UserOption {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  draft: { label: "Entwurf", variant: "secondary", icon: PenLine },
  signed: { label: "Unterschrieben", variant: "default", icon: CheckCircle },
  active: { label: "Aktiv", variant: "default", icon: CheckCircle },
  expired: { label: "Abgelaufen", variant: "destructive", icon: XCircle },
  cancelled: { label: "Storniert", variant: "destructive", icon: XCircle },
};

const PAYMENT_SOURCES = [
  { value: "sfe_ccg", label: "§ 23 SGB VIII (Jugendamt-Förderung)" },
  { value: "local_authority", label: "Jugendamt-finanziert" },
  { value: "employer", label: "Arbeitgeber-Zuschuss (§ 3 Nr. 33 EStG)" },
  { value: "self_funded", label: "Selbstzahler / Privat" },
];

const ContractsPage = () => {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const [view, setView] = useState<"list" | "form" | "preview">("list");
  const [contractType, setContractType] = useState<ContractType | null>(null);
  const [data, setData] = useState<ContractData>(defaultContractData);
  const [savedContracts, setSavedContracts] = useState<SavedContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const contractRef = useRef<HTMLDivElement>(null);

  // Signature state
  const [parentSigData, setParentSigData] = useState("");
  const [parentSigType, setParentSigType] = useState<"typed" | "drawn">("typed");
  const [agencySigData, setAgencySigData] = useState("");
  const [agencySigType, setAgencySigType] = useState<"typed" | "drawn">("typed");
  const [paymentSource, setPaymentSource] = useState("");
  const [eligibilityCode, setEligibilityCode] = useState("");
  const [ofstedUrn, setOfstedUrn] = useState("");
  const [templateVersion] = useState(1);
  const [frozenClauses, setFrozenClauses] = useState<{ title: string; body: string }[] | null>(null);

  const set = (field: keyof ContractData, value: string) => setData((d) => ({ ...d, [field]: value }));
  const today = new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
  const isChildminder = contractType === "childminder";
  const personLabel = isChildminder ? "Kindertagespflegeperson" : "Eltern / Sorgeberechtigte(r)";

  // Fetch users for assignment (admin only)
  useEffect(() => {
    if (!isAdmin) return;
    supabase.from("profiles").select("user_id, first_name, last_name, email, role").order("first_name").then(({ data }) => {
      if (data) setUsers(data as UserOption[]);
    });
  }, [isAdmin]);

  // Fetch contracts
  useEffect(() => {
    if (!user) return;
    const fetchContracts = async () => {
      setLoading(true);
      const { data: contracts, error } = await supabase
        .from("contracts")
        .select("id, contract_type, status, parent_name, parent_email, child_name, childminder_name, start_date, created_at, updated_at, assigned_to, signed_by_parent, signed_by_agency, parent_signature_data, parent_signature_type, agency_signature_data, agency_signature_type, payment_source")
        .order("created_at", { ascending: false });
      if (!error && contracts) setSavedContracts(contracts as SavedContract[]);
      setLoading(false);
    };
    fetchContracts();
  }, [user, isAdmin]);

  const refreshContracts = async () => {
    const { data: contracts } = await supabase
      .from("contracts")
      .select("id, contract_type, status, parent_name, parent_email, child_name, childminder_name, start_date, created_at, updated_at, assigned_to, signed_by_parent, signed_by_agency, parent_signature_data, parent_signature_type, agency_signature_data, agency_signature_type, payment_source")
      .order("created_at", { ascending: false });
    if (contracts) setSavedContracts(contracts as SavedContract[]);
  };

  // Auto-fill from user profile when assigning
  const handleAssignUser = async (userId: string) => {
    setAssignedTo(userId);
    if (!userId) return;

    const selectedUser = users.find(u => u.user_id === userId);
    if (!selectedUser) return;

    // Pre-fill name and email
    const fullName = `${selectedUser.first_name} ${selectedUser.last_name}`.trim();
    setData(d => ({
      ...d,
      parentName: fullName || d.parentName,
      parentEmail: selectedUser.email || d.parentEmail,
    }));

    // Try to fetch parent profile for address/postcode/funding
    if (selectedUser.role === "parent") {
      const { data: pp } = await supabase.from("parent_profiles").select("*").eq("user_id", userId).maybeSingle();
      if (pp) {
        setData(d => ({
          ...d,
          parentAddress: [pp.address_line1, pp.address_line2, pp.city].filter(Boolean).join(", ") || d.parentAddress,
          parentPostcode: pp.postcode || d.parentPostcode,
          localAuthority: pp.local_authority || d.localAuthority,
          fundingRef: pp.sfe_reference || d.fundingRef,
        }));
        if (pp.funding_type) setPaymentSource(pp.funding_type);
      }

      // Fetch children
      const { data: kids } = await supabase.from("children").select("first_name, last_name, date_of_birth").eq("parent_id", userId).order("date_of_birth");
      if (kids && kids.length > 0) {
        const child = kids[0]; // First child
        setData(d => ({
          ...d,
          childName: `${child.first_name} ${child.last_name}`,
          childDob: child.date_of_birth || d.childDob,
        }));
      }
    }

    // Try to fetch childminder profile for Ofsted URN
    if (selectedUser.role === "childminder") {
      const { data: cp } = await supabase.from("childminder_profiles").select("ofsted_urn, town, postcode_district").eq("user_id", userId).maybeSingle();
      if (cp) {
        if (cp.ofsted_urn) setOfstedUrn(cp.ofsted_urn);
        setData(d => ({
          ...d,
          childminderName: fullName,
          parentAddress: cp.town || d.parentAddress,
          parentPostcode: cp.postcode_district || d.parentPostcode,
        }));
      }
    }

    // Fetch phone
    const { data: profile } = await supabase.from("profiles").select("phone").eq("user_id", userId).maybeSingle();
    if (profile?.phone) {
      setData(d => ({ ...d, parentPhone: profile.phone || d.parentPhone }));
    }
  };

  const handleSaveContract = async (status: string = "draft") => {
    if (!user || !contractType) return;
    setSaving(true);
    try {
      // Freeze clauses snapshot when signing or activating
      const shouldSnapshot = (status === "signed" || status === "active");
      const clausesSnapshot = shouldSnapshot ? getContractClauses(contractType, data) : null;

      const payload: Record<string, any> = {
        created_by: user.id,
        contract_type: contractType,
        status,
        parent_name: data.parentName || null,
        parent_email: data.parentEmail || null,
        parent_phone: data.parentPhone || null,
        parent_address: data.parentAddress || null,
        parent_postcode: data.parentPostcode || null,
        child_name: data.childName || null,
        child_dob: data.childDob || null,
        childminder_name: data.childminderName || null,
        funding_ref: data.fundingRef || null,
        local_authority: data.localAuthority || null,
        employer_name: data.employerName || null,
        hours_per_week: data.hoursPerWeek || null,
        rate_per_hour: data.ratePerHour || null,
        start_date: data.startDate || null,
        expires_at: data.expiresAt || null,
        notes: data.notes || null,
        assigned_to: assignedTo || null,
        parent_signature_data: parentSigData || null,
        parent_signature_type: parentSigType,
        agency_signature_data: agencySigData || null,
        agency_signature_type: agencySigType,
        signed_by_parent: !!parentSigData,
        signed_by_agency: !!agencySigData,
        signed_by_parent_at: parentSigData ? new Date().toISOString() : null,
        signed_by_agency_at: agencySigData ? new Date().toISOString() : null,
        payment_source: paymentSource || null,
        parent_eligibility_code: eligibilityCode || null,
        ofsted_urn: ofstedUrn || null,
        ...(clausesSnapshot ? { clauses_snapshot: clausesSnapshot, template_version: templateVersion } : {}),
      };

      if (editingId) {
        const { error } = await supabase.from("contracts").update(payload as any).eq("id", editingId);
        if (error) throw error;
        toast({ title: "Vertrag aktualisiert" });
      } else {
        const { error } = await supabase.from("contracts").insert(payload as any);
        if (error) throw error;
        toast({ title: "Vertrag gespeichert" });
      }

      await refreshContracts();
    } catch (err: any) {
      toast({ title: "Fehler beim Speichern", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDeleteContract = async (id: string) => {
    if (!confirm("Diesen Vertrag löschen?")) return;
    const { error } = await supabase.from("contracts").delete().eq("id", id);
    if (error) {
      toast({ title: "Fehler beim Löschen", description: error.message, variant: "destructive" });
      return;
    }
    setSavedContracts((c) => c.filter((x) => x.id !== id));
    toast({ title: "Vertrag gelöscht" });
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const updatePayload: Record<string, any> = { status: newStatus };
    if (newStatus === "signed") updatePayload.signed_at = new Date().toISOString();
    const { error } = await supabase.from("contracts").update(updatePayload).eq("id", id);
    if (error) {
      toast({ title: "Fehler bei der Aktualisierung", description: error.message, variant: "destructive" });
      return;
    }
    setSavedContracts((c) => c.map((x) => x.id === id ? { ...x, status: newStatus } : x));
    toast({ title: `Status aktualisiert: ${newStatus}` });
  };

  const handleViewContract = async (contract: SavedContract) => {
    const { data: full, error } = await supabase.from("contracts").select("*").eq("id", contract.id).single();
    if (error || !full) return;
    setContractType(full.contract_type as ContractType);
    setData({
      parentName: full.parent_name || "",
      parentEmail: full.parent_email || "",
      parentPhone: full.parent_phone || "",
      parentAddress: full.parent_address || "",
      parentPostcode: full.parent_postcode || "",
      childName: full.child_name || "",
      childDob: full.child_dob || "",
      childminderName: full.childminder_name || "",
      fundingRef: full.funding_ref || "",
      localAuthority: full.local_authority || "",
      employerName: full.employer_name || "",
      hoursPerWeek: full.hours_per_week || "",
      ratePerHour: full.rate_per_hour || "",
      startDate: full.start_date || "",
      expiresAt: full.expires_at || "",
      notes: full.notes || "",
    });
    setAssignedTo((full as any).assigned_to || "");
    setParentSigData((full as any).parent_signature_data || "");
    setParentSigType(((full as any).parent_signature_type as "typed" | "drawn") || "typed");
    setAgencySigData((full as any).agency_signature_data || "");
    setAgencySigType(((full as any).agency_signature_type as "typed" | "drawn") || "typed");
    setPaymentSource((full as any).payment_source || "");
    setEligibilityCode((full as any).parent_eligibility_code || "");
    setOfstedUrn((full as any).ofsted_urn || "");
    // Load frozen clauses snapshot if contract is signed/active
    setFrozenClauses((full as any).clauses_snapshot || null);
    setEditingId(contract.id);
    setView("preview");
  };

  const handleNewContract = (type: ContractType) => {
    setContractType(type);
    setData(defaultContractData);
    setEditingId(null);
    setAssignedTo("");
    setParentSigData("");
    setParentSigType("typed");
    setAgencySigData("");
    setAgencySigType("typed");
    setPaymentSource(type === "sfe_ccg" ? "sfe_ccg" : type === "la_funded" ? "local_authority" : type === "employer" ? "employer" : type === "private" ? "self_funded" : "");
    setEligibilityCode("");
    setOfstedUrn("");
    setFrozenClauses(null);
    setView("form");
  };

  const handlePrint = () => window.print();

  const handleDownloadPNG = async () => {
    if (!contractRef.current) return;
    const canvas = await html2canvas(contractRef.current, { scale: 2, useCORS: true });
    const link = document.createElement("a");
    link.download = `KinderStars-Contract-${contractType}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleEmailContract = async () => {
    const recipientEmail = prompt("E-Mail-Adresse des Empfängers eingeben:");
    if (!recipientEmail) return;
    setEmailing(true);
    try {
      const contractTitle = CONTRACT_TYPES.find(c => c.value === contractType)?.label || "Vertrag";
      const clauses = contractType ? getContractClauses(contractType, data) : [];
      const clausesHtml = clauses.map((c, i) => `<p><strong>${i+1}. ${escapeHtml(c.title)}</strong></p><p>${escapeHtml(c.body)}</p>`).join("");
      const { data: result, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: recipientEmail,
          subject: `KinderStars ${escapeHtml(contractTitle)} Vertrag`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: hsl(222, 95%, 13%);">KINDERSTARS DE</h1>
              <p style="font-size:12px; color:#999;">hallo@kinderstars.de</p>
              <h2 style="color: hsl(44, 93%, 40%);">${escapeHtml(contractTitle)} Vertrag</h2>
              <p><strong>Vertragspartei:</strong> ${escapeHtml(data.parentName || "—")}</p>
              <p><strong>E-Mail:</strong> ${escapeHtml(data.parentEmail || "—")}</p>
              <p><strong>Beginn:</strong> ${data.startDate ? new Date(data.startDate).toLocaleDateString("de-DE") : "offen"}</p>
              ${!isChildminder && data.childName ? `<p><strong>Kind:</strong> ${escapeHtml(data.childName)}</p>` : ""}
              <hr/>
              ${clausesHtml}
              <hr/>
              <p style="font-size:11px; color:#999;">Dieser Vertrag wurde von KinderStars erstellt. Bitte digital über Ihr Portal unterzeichnen.</p>
            </div>
          `,
        },
      });
      if (error) throw error;
      toast({ title: result?.simulated ? "E-Mail simuliert (protokolliert)" : "Vertrag erfolgreich per E-Mail gesendet" });
    } catch (err: any) {
      toast({ title: "E-Mail-Fehler", description: err.message, variant: "destructive" });
    }
    setEmailing(false);
  };

  const goBack = () => {
    setView("list");
    setContractType(null);
    setData(defaultContractData);
    setEditingId(null);
    setAssignedTo("");
    setParentSigData("");
    setAgencySigData("");
    setEligibilityCode("");
    setOfstedUrn("");
    setPaymentSource("");
    setFrozenClauses(null);
  };

  const getUserLabel = (userId: string) => {
    const u = users.find(u => u.user_id === userId);
    return u ? `${u.first_name} ${u.last_name} (${u.email})` : userId;
  };

  // --- RENDER: Contract list ---
  const renderContractsList = () => (
    <div className="space-y-4">
      {isAdmin && (
        <div className="grid gap-3 sm:grid-cols-2">
          {CONTRACT_TYPES.map((ct) => (
            <button
              key={ct.value}
              onClick={() => handleNewContract(ct.value)}
              className="ks-card p-4 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <Plus className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">{ct.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ct.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-2">{isAdmin ? "Alle Verträge" : "Meine Verträge"}</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Lädt…
          </div>
        ) : savedContracts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {isAdmin ? "Noch keine Verträge. Oben einen anlegen." : "Ihnen ist noch kein Vertrag zugewiesen."}
          </p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Typ</TableHead>
                  <TableHead>Vertragspartei</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Unterschriften</TableHead>
                  <TableHead>Beginn</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedContracts.map((c) => {
                  const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft;
                  const Icon = cfg.icon;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-xs">
                        {CONTRACT_TYPES.find((t) => t.value === c.contract_type)?.label || c.contract_type}
                      </TableCell>
                      <TableCell className="text-sm">{c.parent_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant} className="gap-1 text-xs">
                          <Icon className="w-3 h-3" /> {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.signed_by_parent ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                            {c.contract_type === "childminder" ? "KTPP" : "Eltern"} {c.signed_by_parent ? "✓" : "—"}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.signed_by_agency ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                            KinderStars {c.signed_by_agency ? "✓" : "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.start_date ? new Date(c.start_date).toLocaleDateString("de-DE") : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("de-DE")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => handleViewContract(c)} title="Ansehen">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {isAdmin && c.status === "draft" && (
                            <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(c.id, "active")} title="Als aktiv markieren">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                          {isAdmin && c.status === "active" && (
                            <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(c.id, "expired")} title="Als abgelaufen markieren">
                              <Clock className="w-4 h-4 text-orange-500" />
                            </Button>
                          )}
                          {isAdmin && (
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteContract(c.id)} title="Löschen">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );

  // --- RENDER: Form fields ---
  const renderFormFields = () => (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 mb-2">
        <ArrowLeft className="w-4 h-4" /> Zurück
      </Button>
      <h2 className="text-lg font-semibold">
        {CONTRACT_TYPES.find((c) => c.value === contractType)?.label} Vertrag
      </h2>

      {/* Assign to user with auto-fill */}
      {isAdmin && (
        <div className="ks-card p-4 space-y-2 bg-muted/30">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" />
            <label className="text-sm font-bold">Nutzer zuweisen (füllt Daten automatisch aus)</label>
          </div>
          <select value={assignedTo} onChange={(e) => handleAssignUser(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
            <option value="">— Nutzer auswählen —</option>
            {users.filter(u => isChildminder ? u.role === "childminder" : true).map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.first_name} {u.last_name} ({u.email}) — {u.role}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">Bei Auswahl werden Name, E-Mail, Adresse, Kinder und Förderdaten aus dem Profil übernommen.</p>
        </div>
      )}

      {/* Payment source */}
      <div className="ks-card p-4 space-y-2">
        <label className="text-sm font-bold">Zahlungsquelle</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PAYMENT_SOURCES.map(ps => (
            <button key={ps.value} onClick={() => setPaymentSource(ps.value)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors border ${paymentSource === ps.value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:bg-accent"}`}>
              {ps.label}
            </button>
          ))}
        </div>
        {(paymentSource === "sfe_ccg" || paymentSource === "local_authority") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <div className="ks-field">
              <label>{paymentSource === "sfe_ccg" ? "Bewilligungsbescheid-Nr. (§ 23 SGB VIII)" : "Berechtigungsnachweis"}</label>
              <Input value={eligibilityCode} onChange={(e) => setEligibilityCode(e.target.value)}
                placeholder={paymentSource === "sfe_ccg" ? "z. B. Bescheid-Nr. 2026/…" : "Nachweisnummer"} />
            </div>
            {paymentSource === "local_authority" && (
              <div className="ks-field">
                <label>Zuständiges Jugendamt</label>
                <Input value={data.localAuthority} onChange={(e) => set("localAuthority", e.target.value)}
                  placeholder="z. B. Jugendamt Berlin-Mitte" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="ks-field"><label>{personLabel} — Vollständiger Name</label><input value={data.parentName} onChange={(e) => set("parentName", e.target.value)} placeholder="Vor- und Nachname" /></div>
        <div className="ks-field"><label>E-Mail</label><input value={data.parentEmail} onChange={(e) => set("parentEmail", e.target.value)} placeholder="E-Mail" /></div>
        <div className="ks-field"><label>Telefon</label><input value={data.parentPhone} onChange={(e) => set("parentPhone", e.target.value)} placeholder="Telefon" /></div>
        <div className="ks-field"><label>Anschrift</label><input value={data.parentAddress} onChange={(e) => set("parentAddress", e.target.value)} placeholder="Straße, Hausnr., Ort" /></div>
        <div className="ks-field"><label>PLZ</label><input value={data.parentPostcode} onChange={(e) => set("parentPostcode", e.target.value)} placeholder="z. B. 10115" /></div>
        <div className="ks-field"><label>Betreuungsbeginn</label><input type="date" value={data.startDate} onChange={(e) => set("startDate", e.target.value)} /></div>
      </div>

      {!isChildminder && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="ks-field"><label>Name des Kindes</label><input value={data.childName} onChange={(e) => set("childName", e.target.value)} placeholder="Vor- und Nachname" /></div>
          <div className="ks-field"><label>Geburtsdatum des Kindes</label><input type="date" value={data.childDob} onChange={(e) => set("childDob", e.target.value)} /></div>
          <div className="ks-field"><label>Zugewiesene Kindertagespflegeperson</label><input value={data.childminderName} onChange={(e) => set("childminderName", e.target.value)} placeholder="Name der Betreuungsperson" /></div>
          <div className="ks-field"><label>Stunden pro Woche</label><input value={data.hoursPerWeek} onChange={(e) => set("hoursPerWeek", e.target.value)} placeholder="z. B. 30" /></div>
          <div className="ks-field"><label>Stundensatz (€)</label><input value={data.ratePerHour} onChange={(e) => set("ratePerHour", e.target.value)} placeholder="z. B. 8,50" /></div>
        </div>
      )}

      {contractType === "sfe_ccg" && !eligibilityCode && (
        <div className="ks-field"><label>Bewilligungsbescheid-Nr. (§ 23 SGB VIII)</label><input value={data.fundingRef} onChange={(e) => set("fundingRef", e.target.value)} placeholder="Bescheid-Nr." /></div>
      )}
      {contractType === "la_funded" && !data.localAuthority && (
        <div className="ks-field"><label>Zuständiges Jugendamt</label><input value={data.localAuthority} onChange={(e) => set("localAuthority", e.target.value)} placeholder="z. B. Jugendamt München" /></div>
      )}
      {contractType === "employer" && (
        <div className="ks-field"><label>Arbeitgeber</label><input value={data.employerName} onChange={(e) => set("employerName", e.target.value)} placeholder="Name des Arbeitgebers" /></div>
      )}
      {isChildminder && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="ks-field"><label>Stunden pro Woche</label><input value={data.hoursPerWeek} onChange={(e) => set("hoursPerWeek", e.target.value)} placeholder="z. B. 40" /></div>
          <div className="ks-field"><label>Stundensatz (€)</label><input value={data.ratePerHour} onChange={(e) => set("ratePerHour", e.target.value)} placeholder="z. B. 12,00" /></div>
          <div className="ks-field"><label>Pflegeerlaubnis-Nr. (§ 43 SGB VIII)</label><input value={ofstedUrn} onChange={(e) => setOfstedUrn(e.target.value)} placeholder="Aktenzeichen des Jugendamts" /></div>
        </div>
      )}

      {/* Expiry date & notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="ks-field">
          <label>Vertragsende</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !data.expiresAt && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {data.expiresAt ? format(new Date(data.expiresAt), "dd.MM.yyyy") : <span>Datum wählen</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={data.expiresAt ? new Date(data.expiresAt) : undefined}
                onSelect={(date) => set("expiresAt", date ? date.toISOString().split("T")[0] : "")}
                disabled={(date) => date < new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>
        <div className="ks-field">
          <label>Anmerkungen</label>
          <textarea value={data.notes} onChange={(e) => set("notes", e.target.value)}
            placeholder="Zusätzliche Hinweise oder Vereinbarungen…"
            className="w-full min-h-[38px] rounded-lg border border-border bg-card px-3 py-2 text-sm" rows={2} />
        </div>
      </div>

      {/* E-Signatures */}
      <div className="ks-card p-4 space-y-4">
        <h3 className="text-sm font-bold flex items-center gap-2"><PenLine className="w-4 h-4" /> Digitale Unterschriften</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SignaturePad
            label={`Unterschrift ${personLabel}`}
            value={parentSigData}
            type={parentSigType}
            onChange={(d, t) => { setParentSigData(d); setParentSigType(t); }}
          />
          {isAdmin && (
            <SignaturePad
              label="Unterschrift KinderStars"
              value={agencySigData}
              type={agencySigType}
              onChange={(d, t) => { setAgencySigData(d); setAgencySigType(t); }}
            />
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant="hero" onClick={() => { handleSaveContract("draft"); setView("preview"); }} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Speichern & Vorschau
        </Button>
        {parentSigData && agencySigData && (
          <Button variant="warm" onClick={() => { handleSaveContract("signed"); setView("preview"); }} disabled={saving} className="gap-1.5">
            <CheckCircle className="w-4 h-4" /> Als unterschrieben speichern
          </Button>
        )}
        <Button variant="outline" onClick={goBack}>Abbrechen</Button>
      </div>
    </div>
  );

  // --- RENDER: Contract preview ---
  const renderContractPreview = () => {
    // Use frozen clauses snapshot if available (signed/active contracts), otherwise generate live
    const clauses = frozenClauses || getContractClauses(contractType!, data);
    return (
      <div className="space-y-4">
        <div className="flex gap-2 print:hidden flex-wrap">
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Zurück
          </Button>
          <Button variant="hero" size="sm" onClick={handleDownloadPNG} className="gap-1.5"><Download className="w-4 h-4" /> PNG herunterladen</Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5"><Printer className="w-4 h-4" /> Drucken / PDF</Button>
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" onClick={handleEmailContract} disabled={emailing} className="gap-1.5">
                {emailing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} E-Mail
              </Button>
              <Button variant="outline" size="sm" onClick={() => setView("form")} className="gap-1.5">
                <PenLine className="w-4 h-4" /> Bearbeiten
              </Button>
              {editingId && (
                <>
                  {!parentSigData || !agencySigData ? (
                    <Button variant="warm" size="sm" onClick={() => setView("form")} className="gap-1.5">
                      <PenLine className="w-4 h-4" /> Unterschriften hinzufügen
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(editingId, "signed")} className="gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Als unterschrieben markieren
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => { handleSaveContract("active"); }} disabled={saving} className="gap-1.5">
                    Als aktiv markieren
                  </Button>
                </>
              )}
            </>
          )}
          {/* Non-admin can sign their contract */}
          {!isAdmin && editingId && !parentSigData && (
            <Button variant="hero" size="sm" onClick={() => setView("form")} className="gap-1.5">
              <PenLine className="w-4 h-4" /> Vertrag unterschreiben
            </Button>
          )}
        </div>

        {/* Assigned to info */}
        {assignedTo && isAdmin && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            Zugewiesen an: <strong>{getUserLabel(assignedTo)}</strong>
            {paymentSource && <> • Zahlung: <strong>{PAYMENT_SOURCES.find(p => p.value === paymentSource)?.label || paymentSource}</strong></>}
          </div>
        )}

        <div ref={contractRef} className="bg-white text-black p-8 rounded-xl border max-w-[800px] mx-auto print:border-none print:shadow-none" style={{ fontFamily: "Georgia, serif" }}>
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(222, 95%, 13%)" }}>KINDERSTARS DE</h1>
            <p className="text-xs text-gray-500 mt-1">hallo@kinderstars.de • kinderstars.de</p>
            <p className="text-sm font-bold mt-3 uppercase tracking-widest" style={{ color: "hsl(44, 93%, 40%)" }}>
              {CONTRACT_TYPES.find((c) => c.value === contractType)?.label} Vertrag
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <p className="font-bold text-xs uppercase text-gray-500 mb-1">{personLabel}</p>
              <p className="font-semibold">{data.parentName || "_______________"}</p>
              <p>{data.parentAddress || "_______________"}</p>
              <p>{data.parentPostcode || "______"}</p>
              <p>{data.parentEmail || "_______________"}</p>
              <p>{data.parentPhone || "_______________"}</p>
            </div>
            <div>
              <p className="font-bold text-xs uppercase text-gray-500 mb-1">Dienstleister</p>
              <p className="font-semibold">KinderStars DE</p>
              <p>hallo@kinderstars.de</p>
              <p>kinderstars.de</p>
            </div>
          </div>

          {/* Payment source & codes */}
          {paymentSource && (
            <div className="text-sm mb-4 p-3 bg-gray-50 rounded">
              <p className="font-bold text-xs uppercase text-gray-500 mb-1">Zahlung & Förderung</p>
              <p><strong>Quelle:</strong> {PAYMENT_SOURCES.find(p => p.value === paymentSource)?.label || paymentSource}</p>
              {eligibilityCode && <p><strong>{paymentSource === "sfe_ccg" ? "Bescheid-Nr." : "Nachweis"}:</strong> {eligibilityCode}</p>}
              {data.localAuthority && <p><strong>Jugendamt:</strong> {data.localAuthority}</p>}
              {data.fundingRef && !eligibilityCode && <p><strong>Förder-Referenz:</strong> {data.fundingRef}</p>}
            </div>
          )}

          {!isChildminder && data.childName && (
            <div className="text-sm mb-6 p-3 bg-gray-50 rounded">
              <p className="font-bold text-xs uppercase text-gray-500 mb-1">Angaben zum Kind</p>
              <p><strong>Name:</strong> {data.childName}</p>
              {data.childDob && <p><strong>Geburtsdatum:</strong> {new Date(data.childDob).toLocaleDateString("de-DE")}</p>}
              {data.childminderName && <p><strong>Zugewiesene Kindertagespflegeperson:</strong> {data.childminderName}</p>}
            </div>
          )}

          {isChildminder && ofstedUrn && (
            <div className="text-sm mb-4 p-3 bg-gray-50 rounded">
              <p className="font-bold text-xs uppercase text-gray-500 mb-1">Aufsicht & Erlaubnis</p>
              <p><strong>Pflegeerlaubnis-Nr. (§ 43 SGB VIII):</strong> {ofstedUrn}</p>
            </div>
          )}

          <div className="space-y-3 text-sm mb-8">
            {clauses.map((clause, i) => (
              <div key={i}>
                <p className="font-bold">{i + 1}. {clause.title}</p>
                <p className="text-gray-700 leading-relaxed">{clause.body}</p>
              </div>
            ))}
          </div>

          {/* E-Signature display */}
          <div className="grid grid-cols-2 gap-8 mt-12 text-sm">
            <div>
              <p className="font-bold text-xs uppercase text-gray-500 mb-2">Unterschrift {personLabel}</p>
              {parentSigData ? (
                parentSigType === "drawn" ? (
                  <img src={parentSigData} alt="Unterschrift" className="h-16 object-contain" />
                ) : (
                  <p className="text-2xl italic" style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}>{parentSigData}</p>
                )
              ) : (
                <div className="border-b border-black mb-1 h-8" />
              )}
              <p className="text-xs text-gray-500 mt-1">{parentSigData ? "Digital unterschrieben" : "Unterschrift"}</p>
              <p className="mt-2 font-medium">{data.parentName || "_______________"}</p>
              <p className="text-xs text-gray-500 mt-1">Datum: {today}</p>
            </div>
            <div>
              <p className="font-bold text-xs uppercase text-gray-500 mb-2">Für KinderStars DE unterzeichnet</p>
              {agencySigData ? (
                agencySigType === "drawn" ? (
                  <img src={agencySigData} alt="Unterschrift KinderStars" className="h-16 object-contain" />
                ) : (
                  <p className="text-2xl italic" style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}>{agencySigData}</p>
                )
              ) : (
                <div className="border-b border-black mb-1 h-8" />
              )}
              <p className="text-xs text-gray-500 mt-1">{agencySigData ? "Digital unterschrieben" : "Unterschrift"}</p>
              <p className="mt-2 font-medium">Bevollmächtigte(r)</p>
              <p className="text-xs text-gray-500 mt-1">Datum: {today}</p>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 text-center mt-8">
            KinderStars DE • hallo@kinderstars.de • kinderstars.de
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verträge</h1>
        <p className="text-muted-foreground text-sm">
          {isAdmin ? "Betreuungsverträge erstellen, zuweisen und mit digitaler Unterschrift verwalten" : "Ihre Verträge einsehen und digital unterschreiben"}
        </p>
      </div>
      {view === "list" && renderContractsList()}
      {view === "form" && renderFormFields()}
      {view === "preview" && renderContractPreview()}
    </div>
  );
};

export default ContractsPage;
