import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2, Trash2, CheckCircle2, Clock, XCircle, Eye, Shield, CreditCard, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "react-router-dom";

const CHILDMINDER_DOC_TYPES = [
  { value: "dbs_certificate", label: "Erweitertes Führungszeugnis (§ 30a BZRG)" },
  { value: "first_aid_cert", label: "Erste-Hilfe am Kind (Nachweis)" },
  { value: "insurance", label: "Berufshaftpflichtversicherung (Nachweis)" },
  { value: "ofsted_registration", label: "Pflegeerlaubnis Jugendamt (§ 43 SGB VIII)" },
  { value: "safeguarding_cert", label: "Kinderschutz-Fortbildung (§ 8a SGB VIII)" },
  { value: "paediatric_first_aid", label: "Kinder-Notfallmedizin (Aufbaukurs)" },
  { value: "food_hygiene", label: "Belehrung nach § 43 IfSG (Gesundheitsamt)" },
  { value: "profile_photo", label: "Profilfoto" },
  { value: "references", label: "Referenzen" },
  { value: "right_to_work", label: "Aufenthalts-/Arbeitserlaubnis" },
  { value: "other", label: "Sonstiges Dokument" },
];

const PARENT_DOC_TYPES = [
  { value: "photo_id", label: "Lichtbildausweis (Personalausweis / Reisepass)" },
  { value: "proof_of_address", label: "Meldebescheinigung / Adressnachweis" },
  { value: "birth_certificate", label: "Geburtsurkunde des Kindes" },
  { value: "medical_records", label: "Gesundheitsunterlagen (U-Heft, Impfpass)" },
  { value: "consent_form", label: "Einwilligungserklärung" },
  { value: "other", label: "Sonstiges Dokument" },
];

const DBS_PAYMENTS = [
  { key: "dbs_standard", label: "Einfaches Führungszeugnis", price: "€13", desc: "Nur für interne Zwecke — nicht ausreichend für Kinderbetreuung" },
  { key: "dbs_enhanced", label: "Erweitertes Führungszeugnis (§ 30a BZRG)", price: "€13", desc: "Pflicht für Kinderbetreuung — Antrag beim Bürgeramt" },
  { key: "bpss", label: "Zuverlässigkeitsprüfung Premium", price: "€49", desc: "Ident- und Zuverlässigkeitsprüfung digital" },
];

interface ComplianceDoc {
  id: string;
  document_type: string;
  document_url: string | null;
  status: string | null;
  expires_at: string | null;
  review_notes: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-primary/15 text-foreground",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
};

const DocumentsPage = () => {
  const { t } = useTranslation();
  const { user, userRole } = useAuth();
  const location = useLocation();
  const isParentPortal = location.pathname.startsWith("/parent");
  const DOC_TYPES = isParentPortal ? PARENT_DOC_TYPES : CHILDMINDER_DOC_TYPES;
  const ALL_DOC_TYPES = [...CHILDMINDER_DOC_TYPES, ...PARENT_DOC_TYPES];

  const [docs, setDocs] = useState<ComplianceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState(DOC_TYPES[0].value);
  const [expiryDate, setExpiryDate] = useState("");
  const [payingKey, setPayingKey] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("compliance_documents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setDocs((data ?? []) as ComplianceDoc[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${selectedType}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("compliance-docs").upload(path, file);
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { error } = await supabase.from("compliance_documents").insert({
      user_id: user.id,
      document_type: selectedType,
      document_url: path,
      status: "pending",
      expires_at: expiryDate || null,
    });
    if (error) {
      toast({ title: "Error saving record", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Document uploaded!", description: "It will be reviewed by an admin." });
      setExpiryDate("");
      fetchDocs();
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async (doc: ComplianceDoc) => {
    if (doc.status === "approved") {
      toast({ title: "Cannot delete approved documents", variant: "destructive" });
      return;
    }
    if (doc.document_url) {
      await supabase.storage.from("compliance-docs").remove([doc.document_url]);
    }
    await supabase.from("compliance_documents").delete().eq("id", doc.id);
    toast({ title: "Document deleted" });
    fetchDocs();
  };

  const getSignedUrl = async (path: string) => {
    const { data } = await supabase.storage.from("compliance-docs").createSignedUrl(path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const handleDbsPayment = async (priceKey: string) => {
    setPayingKey(priceKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { price_key: priceKey },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error starting payment";
      toast({ title: "Payment error", description: msg, variant: "destructive" });
    } finally {
      setPayingKey(null);
    }
  };

  const typeLabel = (val: string) => ALL_DOC_TYPES.find((d) => d.value === val)?.label || val.replace(/_/g, " ");

  const requiredParentDocs = ["photo_id", "proof_of_address"];
  const uploadedTypes = docs.map(d => d.document_type);
  const missingDocs = isParentPortal ? requiredParentDocs.filter(t => !uploadedTypes.includes(t)) : [];

  if (loading) return <div className="text-muted-foreground p-4">Loading…</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6" /> {isParentPortal ? t('portal.documents.identityDocs', 'Ausweis- & Adressdokumente') : t('portal.documents.title', 'Meine Dokumente')}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isParentPortal
            ? t('portal.documents.parentDesc', 'Bitte Lichtbildausweis und Adressnachweis hochladen. Diese sind für den Abschluss der Verifizierung erforderlich.')
            : t('portal.documents.childminderDesc', 'Laden Sie Ihre Nachweise (Führungszeugnis, Erste-Hilfe am Kind, Haftpflicht, ggf. Pflegeerlaubnis) zur Prüfung durch das KinderStars-Compliance-Team hoch.')}
        </p>
      </div>

      {/* Missing docs warning for parents */}
      {isParentPortal && missingDocs.length > 0 && (
        <div className="ks-card p-4 bg-destructive/5 border-destructive/20 space-y-1">
          <p className="text-sm font-bold text-destructive">⚠️ Erforderliche Dokumente fehlen:</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            {missingDocs.map(d => (
              <li key={d}>{typeLabel(d)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* DBS / BPSS payment section — childminder only */}
      {!isParentPortal && (
        <div className="ks-card p-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-secondary" /> Führungszeugnis / Zuverlässigkeitsprüfung beauftragen
          </h3>
          <p className="text-xs text-muted-foreground">
            Das erweiterte Führungszeugnis beantragen Sie beim Bürgeramt (§ 30a BZRG). Alternativ nutzen Sie unsere digitale Zuverlässigkeitsprüfung. Nach Erhalt hier hochladen.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DBS_PAYMENTS.map(item => (
              <div key={item.key} className="rounded-xl border border-border p-3 space-y-2">
                <div>
                  <p className="text-sm font-bold">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-secondary">{item.price}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-8 text-xs"
                    disabled={payingKey === item.key}
                    onClick={() => handleDbsPayment(item.key)}
                  >
                    {payingKey === item.key
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <ExternalLink className="w-3.5 h-3.5" />}
                    Bezahlen
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload form */}
      <div className="ks-card p-4 space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-1.5"><Upload className="w-4 h-4" /> {t('portal.documents.uploadDocument', 'Dokument hochladen')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Dokumententyp</label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {DOC_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Ablaufdatum (optional)</label>
            <input
              type="date"
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Datei (PDF, JPG, PNG — max. 10 MB)</label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleUpload}
              disabled={uploading}
              className="w-full h-10 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-secondary-foreground file:text-xs"
            />
          </div>
        </div>
        {uploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Wird hochgeladen…
          </div>
        )}
      </div>

      {/* Documents list */}
      <div className="space-y-2">
        {docs.length === 0 ? (
          <div className="ks-card p-8 text-center text-muted-foreground text-sm">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            {t('portal.documents.noDocuments', 'Noch keine Dokumente hochgeladen')}
          </div>
        ) : docs.map((doc) => (
          <div key={doc.id} className="ks-card p-4 flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{typeLabel(doc.document_type)}</div>
              <div className="text-xs text-muted-foreground">
                Hochgeladen am {format(new Date(doc.created_at), "dd.MM.yyyy")}
                {doc.expires_at && ` · gültig bis ${format(new Date(doc.expires_at), "dd.MM.yyyy")}`}
              </div>
              {doc.review_notes && (
                <div className="text-xs text-muted-foreground mt-1 italic">"{doc.review_notes}"</div>
              )}
            </div>
            <span className={`text-[11px] px-2 py-1 rounded-full font-bold shrink-0 ${STATUS_STYLES[doc.status || "pending"]}`}>
              {doc.status === "approved" && <CheckCircle2 className="w-3 h-3 inline mr-0.5" />}
              {doc.status === "rejected" && <XCircle className="w-3 h-3 inline mr-0.5" />}
              {doc.status === "pending" && <Clock className="w-3 h-3 inline mr-0.5" />}
              {doc.status || "pending"}
            </span>
            <div className="flex gap-1 shrink-0">
              {doc.document_url && (
                <Button variant="ghost" size="sm" onClick={() => getSignedUrl(doc.document_url!)}>
                  <Eye className="w-4 h-4" />
                </Button>
              )}
              {doc.status !== "approved" && (
                <Button variant="ghost" size="sm" onClick={() => handleDelete(doc)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentsPage;
