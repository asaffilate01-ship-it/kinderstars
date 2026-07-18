import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Save, CreditCard, Building2, GraduationCap, Landmark } from "lucide-react";

const FUNDING_TYPES = [
  { value: "self_funded", label: "Self-funded (Private)", icon: CreditCard },
  { value: "sfe", label: "Student Finance England (SFE)", icon: GraduationCap },
  { value: "ccg", label: "NHS CCG / ICB Funded", icon: Building2 },
  { value: "local_authority", label: "Local Authority (Free Hours)", icon: Landmark },
  { value: "tax_free_childcare", label: "Tax-Free Childcare (HMRC)", icon: CreditCard },
  { value: "employer", label: "Employer-funded", icon: Building2 },
];

const PAYMENT_METHODS = ["Direct Debit", "Bank Transfer", "Credit/Debit Card", "Childcare Vouchers", "Tax-Free Childcare Account"];

const FundingPage = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({
    funding_type: "self_funded",
    sfe_reference: "",
    ccg_details: "",
    local_authority: "",
    payment_method: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("parent_profiles").select("funding_type, sfe_reference, ccg_details, local_authority, payment_method")
      .eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data) {
          setForm({
            funding_type: data.funding_type || "self_funded",
            sfe_reference: data.sfe_reference || "",
            ccg_details: data.ccg_details || "",
            local_authority: data.local_authority || "",
            payment_method: data.payment_method || "",
          });
        }
        setLoaded(true);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("parent_profiles").upsert({
      user_id: user.id,
      funding_type: form.funding_type,
      sfe_reference: form.sfe_reference || null,
      ccg_details: form.ccg_details || null,
      local_authority: form.local_authority || null,
      payment_method: form.payment_method || null,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Funding configuration saved" });
    }
  };

  if (!loaded) return <div className="text-muted-foreground text-sm py-10 text-center">Loading…</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Funding & Payments</h1>
      <p className="text-muted-foreground text-sm mb-6">Configure how your childcare is funded and your payment preferences.</p>

      <div className="space-y-6">
        {/* Funding type selection */}
        <div className="ks-card p-5">
          <h2 className="font-bold text-sm mb-3">Funding Type</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FUNDING_TYPES.map((ft) => (
              <button key={ft.value} type="button" onClick={() => setForm({ ...form, funding_type: ft.value })}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition-all ${
                  form.funding_type === ft.value
                    ? "border-secondary bg-secondary/8 font-medium"
                    : "border-border hover:border-secondary/30 bg-card"
                }`}>
                <ft.icon className={`w-5 h-5 ${form.funding_type === ft.value ? "text-secondary" : "text-muted-foreground"}`} />
                {ft.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional fields */}
        {form.funding_type === "sfe" && (
          <div className="ks-card p-5">
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4" /> SFE Details</h2>
            <div className="ks-field">
              <label>SFE Reference Number</label>
              <input value={form.sfe_reference} onChange={(e) => setForm({ ...form, sfe_reference: e.target.value })}
                placeholder="e.g. SFE/2026/1234567" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Your Student Finance England reference for childcare grant claims (CCG/PCG).</p>
          </div>
        )}

        {form.funding_type === "ccg" && (
          <div className="ks-card p-5">
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2"><Building2 className="w-4 h-4" /> CCG / ICB Details</h2>
            <div className="ks-field">
              <label>CCG / ICB Details</label>
              <textarea value={form.ccg_details} onChange={(e) => setForm({ ...form, ccg_details: e.target.value })}
                placeholder="Provide your CCG/ICB reference, funding arrangement details…" />
            </div>
          </div>
        )}

        {form.funding_type === "local_authority" && (
          <div className="ks-card p-5">
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2"><Landmark className="w-4 h-4" /> Local Authority</h2>
            <div className="ks-field">
              <label>Local Authority Name</label>
              <input value={form.local_authority} onChange={(e) => setForm({ ...form, local_authority: e.target.value })}
                placeholder="e.g. Luton Borough Council" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">For 15/30 funded hours entitlement. KinderStars will claim directly — you need to provide your eligibility code to KinderStars if relevant.</p>
          </div>
        )}

        {form.funding_type === "tax_free_childcare" && (
          <div className="ks-card p-5">
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Tax-Free Childcare</h2>
            <p className="text-sm text-muted-foreground">
              Tax-Free Childcare provides up to £2,000 per year per child. You pay into your online account and the government tops up every £8 you pay in with an extra £2.
            </p>
            <p className="text-xs text-muted-foreground mt-2">Apply at <span className="font-medium">childcarechoices.gov.uk</span>. Your childminder's details will be needed.</p>
          </div>
        )}

        {/* Payment method — only for self-funded */}
        {form.funding_type === "self_funded" && (
          <div className="ks-card p-5">
            <h2 className="font-bold text-sm mb-3">Preferred Payment Method</h2>
            <div className="ks-field">
              <label>Payment method</label>
              <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                <option value="">Select…</option>
                {PAYMENT_METHODS.map((pm) => <option key={pm} value={pm}>{pm}</option>)}
              </select>
            </div>
          </div>
        )}

        {form.funding_type && form.funding_type !== "self_funded" && (
          <div className="ks-card p-5">
            <h2 className="font-bold text-sm mb-3">Payment</h2>
            <p className="text-sm text-muted-foreground">
              💡 KinderStars will invoice the relevant funding body directly. No payment method selection is needed.
            </p>
          </div>
        )}

        <Button variant="success" onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
};

export default FundingPage;
