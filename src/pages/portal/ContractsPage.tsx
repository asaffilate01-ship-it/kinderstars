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
  draft: { label: "Draft", variant: "secondary", icon: PenLine },
  signed: { label: "Signed", variant: "default", icon: CheckCircle },
  active: { label: "Active", variant: "default", icon: CheckCircle },
  expired: { label: "Expired", variant: "destructive", icon: XCircle },
  cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
};

const PAYMENT_SOURCES = [
  { value: "sfe_ccg", label: "Student Finance / CCG" },
  { value: "local_authority", label: "Local Authority Funded" },
  { value: "employer", label: "Employer Scheme" },
  { value: "self_funded", label: "Self-Funded / Private" },
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
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const isChildminder = contractType === "childminder";
  const personLabel = isChildminder ? "Childminder" : "Parent/Guardian";

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
        toast({ title: "Contract updated" });
      } else {
        const { error } = await supabase.from("contracts").insert(payload as any);
        if (error) throw error;
        toast({ title: "Contract saved" });
      }

      await refreshContracts();
    } catch (err: any) {
      toast({ title: "Save error", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDeleteContract = async (id: string) => {
    if (!confirm("Delete this contract?")) return;
    const { error } = await supabase.from("contracts").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete error", description: error.message, variant: "destructive" });
      return;
    }
    setSavedContracts((c) => c.filter((x) => x.id !== id));
    toast({ title: "Contract deleted" });
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const updatePayload: Record<string, any> = { status: newStatus };
    if (newStatus === "signed") updatePayload.signed_at = new Date().toISOString();
    const { error } = await supabase.from("contracts").update(updatePayload).eq("id", id);
    if (error) {
      toast({ title: "Update error", description: error.message, variant: "destructive" });
      return;
    }
    setSavedContracts((c) => c.map((x) => x.id === id ? { ...x, status: newStatus } : x));
    toast({ title: `Status updated to ${newStatus}` });
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
    const recipientEmail = prompt("Enter recipient email address:");
    if (!recipientEmail) return;
    setEmailing(true);
    try {
      const contractTitle = CONTRACT_TYPES.find(c => c.value === contractType)?.label || "Contract";
      const clauses = contractType ? getContractClauses(contractType, data) : [];
      const clausesHtml = clauses.map((c, i) => `<p><strong>${i+1}. ${escapeHtml(c.title)}</strong></p><p>${escapeHtml(c.body)}</p>`).join("");
      const { data: result, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: recipientEmail,
          subject: `KinderStars ${escapeHtml(contractTitle)} Contract`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: hsl(222, 95%, 13%);">KINDERSTARS LTD</h1>
              <p style="font-size:12px; color:#999;">Victory House, Luton LU1 3BS • hello@kinderstars.co.uk</p>
              <h2 style="color: hsl(44, 93%, 40%);">${escapeHtml(contractTitle)} Contract</h2>
              <p><strong>Party:</strong> ${escapeHtml(data.parentName || "N/A")}</p>
              <p><strong>Email:</strong> ${escapeHtml(data.parentEmail || "N/A")}</p>
              <p><strong>Start Date:</strong> ${data.startDate ? new Date(data.startDate).toLocaleDateString("en-GB") : "TBC"}</p>
              ${!isChildminder && data.childName ? `<p><strong>Child:</strong> ${escapeHtml(data.childName)}</p>` : ""}
              <hr/>
              ${clausesHtml}
              <hr/>
              <p style="font-size:11px; color:#999;">This contract was generated by KinderStars Ltd. Please sign digitally via your portal.</p>
            </div>
          `,
        },
      });
      if (error) throw error;
      toast({ title: result?.simulated ? "Email simulated (logged)" : "Contract emailed successfully" });
    } catch (err: any) {
      toast({ title: "Email error", description: err.message, variant: "destructive" });
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
        <h2 className="text-lg font-semibold mb-2">{isAdmin ? "All Contracts" : "My Contracts"}</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : savedContracts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {isAdmin ? "No contracts yet. Create one above." : "No contracts assigned to you yet."}
          </p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signatures</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                            {c.contract_type === "childminder" ? "CM" : "Parent"} {c.signed_by_parent ? "✓" : "—"}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.signed_by_agency ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                            Agency {c.signed_by_agency ? "✓" : "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.start_date ? new Date(c.start_date).toLocaleDateString("en-GB") : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("en-GB")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => handleViewContract(c)} title="View">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {isAdmin && c.status === "draft" && (
                            <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(c.id, "active")} title="Mark Active">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                          {isAdmin && c.status === "active" && (
                            <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(c.id, "expired")} title="Mark Expired">
                              <Clock className="w-4 h-4 text-orange-500" />
                            </Button>
                          )}
                          {isAdmin && (
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteContract(c.id)} title="Delete">
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
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>
      <h2 className="text-lg font-semibold">
        {CONTRACT_TYPES.find((c) => c.value === contractType)?.label} Contract
      </h2>

      {/* Assign to user with auto-fill */}
      {isAdmin && (
        <div className="ks-card p-4 space-y-2 bg-muted/30">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" />
            <label className="text-sm font-bold">Assign to User (auto-fills details)</label>
          </div>
          <select value={assignedTo} onChange={(e) => handleAssignUser(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
            <option value="">— Select a user —</option>
            {users.filter(u => isChildminder ? u.role === "childminder" : true).map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.first_name} {u.last_name} ({u.email}) — {u.role}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">Selecting a user auto-fills their name, email, address, children, and funding details from their profile.</p>
        </div>
      )}

      {/* Payment source */}
      <div className="ks-card p-4 space-y-2">
        <label className="text-sm font-bold">Payment Source</label>
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
              <label>{paymentSource === "sfe_ccg" ? "SFE / CCG Reference" : "Eligibility Code"}</label>
              <Input value={eligibilityCode} onChange={(e) => setEligibilityCode(e.target.value)}
                placeholder={paymentSource === "sfe_ccg" ? "SFE reference number" : "Eligibility code"} />
            </div>
            {paymentSource === "local_authority" && (
              <div className="ks-field">
                <label>Local Authority</label>
                <Input value={data.localAuthority} onChange={(e) => set("localAuthority", e.target.value)}
                  placeholder="e.g. Luton Borough Council" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="ks-field"><label>{personLabel} Full Name</label><input value={data.parentName} onChange={(e) => set("parentName", e.target.value)} placeholder="Full name" /></div>
        <div className="ks-field"><label>Email</label><input value={data.parentEmail} onChange={(e) => set("parentEmail", e.target.value)} placeholder="Email" /></div>
        <div className="ks-field"><label>Phone</label><input value={data.parentPhone} onChange={(e) => set("parentPhone", e.target.value)} placeholder="Phone" /></div>
        <div className="ks-field"><label>Address</label><input value={data.parentAddress} onChange={(e) => set("parentAddress", e.target.value)} placeholder="Address" /></div>
        <div className="ks-field"><label>Postcode</label><input value={data.parentPostcode} onChange={(e) => set("parentPostcode", e.target.value)} placeholder="Postcode" /></div>
        <div className="ks-field"><label>Start Date</label><input type="date" value={data.startDate} onChange={(e) => set("startDate", e.target.value)} /></div>
      </div>

      {!isChildminder && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="ks-field"><label>Child's Full Name</label><input value={data.childName} onChange={(e) => set("childName", e.target.value)} placeholder="Child name" /></div>
          <div className="ks-field"><label>Child's Date of Birth</label><input type="date" value={data.childDob} onChange={(e) => set("childDob", e.target.value)} /></div>
          <div className="ks-field"><label>Assigned Childminder</label><input value={data.childminderName} onChange={(e) => set("childminderName", e.target.value)} placeholder="Childminder name" /></div>
          <div className="ks-field"><label>Hours Per Week</label><input value={data.hoursPerWeek} onChange={(e) => set("hoursPerWeek", e.target.value)} placeholder="e.g. 30" /></div>
          <div className="ks-field"><label>Rate Per Hour (£)</label><input value={data.ratePerHour} onChange={(e) => set("ratePerHour", e.target.value)} placeholder="e.g. 7.50" /></div>
        </div>
      )}

      {contractType === "sfe_ccg" && !eligibilityCode && (
        <div className="ks-field"><label>SFE / CCG Reference Number</label><input value={data.fundingRef} onChange={(e) => set("fundingRef", e.target.value)} placeholder="SFE reference" /></div>
      )}
      {contractType === "la_funded" && !data.localAuthority && (
        <div className="ks-field"><label>Local Authority</label><input value={data.localAuthority} onChange={(e) => set("localAuthority", e.target.value)} placeholder="e.g. Luton Borough Council" /></div>
      )}
      {contractType === "employer" && (
        <div className="ks-field"><label>Employer Name</label><input value={data.employerName} onChange={(e) => set("employerName", e.target.value)} placeholder="Employer name" /></div>
      )}
      {isChildminder && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="ks-field"><label>Hours Per Week</label><input value={data.hoursPerWeek} onChange={(e) => set("hoursPerWeek", e.target.value)} placeholder="e.g. 40" /></div>
          <div className="ks-field"><label>Rate Per Hour (£)</label><input value={data.ratePerHour} onChange={(e) => set("ratePerHour", e.target.value)} placeholder="e.g. 12.00" /></div>
          <div className="ks-field"><label>Ofsted URN</label><input value={ofstedUrn} onChange={(e) => setOfstedUrn(e.target.value)} placeholder="Ofsted URN" /></div>
        </div>
      )}

      {/* Expiry date & notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="ks-field">
          <label>Contract Expiry Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !data.expiresAt && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {data.expiresAt ? format(new Date(data.expiresAt), "PPP") : <span>Pick expiry date</span>}
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
          <label>Notes</label>
          <textarea value={data.notes} onChange={(e) => set("notes", e.target.value)}
            placeholder="Additional notes or terms…"
            className="w-full min-h-[38px] rounded-lg border border-border bg-card px-3 py-2 text-sm" rows={2} />
        </div>
      </div>

      {/* E-Signatures */}
      <div className="ks-card p-4 space-y-4">
        <h3 className="text-sm font-bold flex items-center gap-2"><PenLine className="w-4 h-4" /> E-Signatures</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SignaturePad
            label={`${personLabel} Signature`}
            value={parentSigData}
            type={parentSigType}
            onChange={(d, t) => { setParentSigData(d); setParentSigType(t); }}
          />
          {isAdmin && (
            <SignaturePad
              label="KinderStars Agency Signature"
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
          Save & Preview
        </Button>
        {parentSigData && agencySigData && (
          <Button variant="warm" onClick={() => { handleSaveContract("signed"); setView("preview"); }} disabled={saving} className="gap-1.5">
            <CheckCircle className="w-4 h-4" /> Save as Signed
          </Button>
        )}
        <Button variant="outline" onClick={goBack}>Cancel</Button>
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
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <Button variant="hero" size="sm" onClick={handleDownloadPNG} className="gap-1.5"><Download className="w-4 h-4" /> Download PNG</Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5"><Printer className="w-4 h-4" /> Print / PDF</Button>
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" onClick={handleEmailContract} disabled={emailing} className="gap-1.5">
                {emailing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} Email
              </Button>
              <Button variant="outline" size="sm" onClick={() => setView("form")} className="gap-1.5">
                <PenLine className="w-4 h-4" /> Edit
              </Button>
              {editingId && (
                <>
                  {!parentSigData || !agencySigData ? (
                    <Button variant="warm" size="sm" onClick={() => setView("form")} className="gap-1.5">
                      <PenLine className="w-4 h-4" /> Add Signatures
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(editingId, "signed")} className="gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Mark Signed
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => { handleSaveContract("active"); }} disabled={saving} className="gap-1.5">
                    Mark Active
                  </Button>
                </>
              )}
            </>
          )}
          {/* Non-admin can sign their contract */}
          {!isAdmin && editingId && !parentSigData && (
            <Button variant="hero" size="sm" onClick={() => setView("form")} className="gap-1.5">
              <PenLine className="w-4 h-4" /> Sign Contract
            </Button>
          )}
        </div>

        {/* Assigned to info */}
        {assignedTo && isAdmin && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            Assigned to: <strong>{getUserLabel(assignedTo)}</strong>
            {paymentSource && <> • Payment: <strong>{PAYMENT_SOURCES.find(p => p.value === paymentSource)?.label || paymentSource}</strong></>}
          </div>
        )}

        <div ref={contractRef} className="bg-white text-black p-8 rounded-xl border max-w-[800px] mx-auto print:border-none print:shadow-none" style={{ fontFamily: "Georgia, serif" }}>
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(222, 95%, 13%)" }}>KINDERSTARS LTD</h1>
            <p className="text-xs text-gray-500 mt-1">Victory House, Luton LU1 3BS • hello@kinderstars.co.uk • 07585 803505</p>
            <p className="text-sm font-bold mt-3 uppercase tracking-widest" style={{ color: "hsl(44, 93%, 40%)" }}>
              {CONTRACT_TYPES.find((c) => c.value === contractType)?.label} Contract
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
              <p className="font-bold text-xs uppercase text-gray-500 mb-1">Service Provider</p>
              <p className="font-semibold">KinderStars Ltd</p>
              <p>Victory House</p>
              <p>Luton LU1 3BS</p>
              <p>hello@kinderstars.co.uk</p>
              <p>07585 803505</p>
            </div>
          </div>

          {/* Payment source & codes */}
          {paymentSource && (
            <div className="text-sm mb-4 p-3 bg-gray-50 rounded">
              <p className="font-bold text-xs uppercase text-gray-500 mb-1">Payment & Funding</p>
              <p><strong>Source:</strong> {PAYMENT_SOURCES.find(p => p.value === paymentSource)?.label || paymentSource}</p>
              {eligibilityCode && <p><strong>{paymentSource === "sfe_ccg" ? "SFE/CCG Reference" : "Eligibility Code"}:</strong> {eligibilityCode}</p>}
              {data.localAuthority && <p><strong>Local Authority:</strong> {data.localAuthority}</p>}
              {data.fundingRef && !eligibilityCode && <p><strong>Funding Reference:</strong> {data.fundingRef}</p>}
            </div>
          )}

          {!isChildminder && data.childName && (
            <div className="text-sm mb-6 p-3 bg-gray-50 rounded">
              <p className="font-bold text-xs uppercase text-gray-500 mb-1">Child Details</p>
              <p><strong>Name:</strong> {data.childName}</p>
              {data.childDob && <p><strong>Date of Birth:</strong> {new Date(data.childDob).toLocaleDateString("en-GB")}</p>}
              {data.childminderName && <p><strong>Assigned Childminder:</strong> {data.childminderName}</p>}
            </div>
          )}

          {isChildminder && ofstedUrn && (
            <div className="text-sm mb-4 p-3 bg-gray-50 rounded">
              <p className="font-bold text-xs uppercase text-gray-500 mb-1">Regulatory</p>
              <p><strong>Ofsted URN:</strong> {ofstedUrn}</p>
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
              <p className="font-bold text-xs uppercase text-gray-500 mb-2">Signed by {personLabel}</p>
              {parentSigData ? (
                parentSigType === "drawn" ? (
                  <img src={parentSigData} alt="Signature" className="h-16 object-contain" />
                ) : (
                  <p className="text-2xl italic" style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}>{parentSigData}</p>
                )
              ) : (
                <div className="border-b border-black mb-1 h-8" />
              )}
              <p className="text-xs text-gray-500 mt-1">{parentSigData ? "Digitally signed" : "Signature"}</p>
              <p className="mt-2 font-medium">{data.parentName || "_______________"}</p>
              <p className="text-xs text-gray-500 mt-1">Date: {today}</p>
            </div>
            <div>
              <p className="font-bold text-xs uppercase text-gray-500 mb-2">Signed for KinderStars Ltd</p>
              {agencySigData ? (
                agencySigType === "drawn" ? (
                  <img src={agencySigData} alt="Agency Signature" className="h-16 object-contain" />
                ) : (
                  <p className="text-2xl italic" style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}>{agencySigData}</p>
                )
              ) : (
                <div className="border-b border-black mb-1 h-8" />
              )}
              <p className="text-xs text-gray-500 mt-1">{agencySigData ? "Digitally signed" : "Signature"}</p>
              <p className="mt-2 font-medium">Authorised Representative</p>
              <p className="text-xs text-gray-500 mt-1">Date: {today}</p>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 text-center mt-8">
            KinderStars Ltd • Registered in England & Wales • hello@kinderstars.co.uk
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contracts</h1>
        <p className="text-muted-foreground text-sm">
          {isAdmin ? "Create, assign, and manage care contracts with e-signatures" : "View and sign contracts assigned to you"}
        </p>
      </div>
      {view === "list" && renderContractsList()}
      {view === "form" && renderFormFields()}
      {view === "preview" && renderContractPreview()}
    </div>
  );
};

export default ContractsPage;
