import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Save, Home, Dog, CreditCard } from "lucide-react";

const PROPERTY_TYPES = ["Detached", "Semi-detached", "Terraced", "Flat/Apartment", "Bungalow", "Other"];

const ParentProfile = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({
    address_line1: "", address_line2: "", city: "", postcode: "",
    property_type: "", has_pets: false, pet_details: "",
    parking_available: true, special_requirements: "",
    funding_type: "", payment_method: "",
  });
  const [profileData, setProfileData] = useState({ first_name: "", last_name: "", phone: "" });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("parent_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("first_name, last_name, phone").eq("user_id", user.id).maybeSingle(),
    ]).then(([parentRes, profileRes]) => {
      if (parentRes.data) {
        setForm({
          address_line1: parentRes.data.address_line1 || "",
          address_line2: parentRes.data.address_line2 || "",
          city: parentRes.data.city || "",
          postcode: parentRes.data.postcode || "",
          property_type: parentRes.data.property_type || "",
          has_pets: parentRes.data.has_pets || false,
          pet_details: parentRes.data.pet_details || "",
          parking_available: parentRes.data.parking_available ?? true,
          special_requirements: parentRes.data.special_requirements || "",
          funding_type: parentRes.data.funding_type || "",
          payment_method: parentRes.data.payment_method || "",
        });
      }
      if (profileRes.data) {
        setProfileData({
          first_name: profileRes.data.first_name || "",
          last_name: profileRes.data.last_name || "",
          phone: profileRes.data.phone || "",
        });
      }
      setLoaded(true);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    // Update main profile
    await supabase.from("profiles").update({
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      phone: profileData.phone,
    }).eq("user_id", user.id);

    // Upsert parent profile
    const { error } = await supabase.from("parent_profiles").upsert({
      user_id: user.id,
      ...form,
    }, { onConflict: "user_id" });

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved" });
    }
  };

  if (!loaded) return <div className="text-muted-foreground text-sm py-10 text-center">Loading…</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">My Details</h1>
      <p className="text-muted-foreground text-sm mb-6">Your personal and property information for childminder matching.</p>

      <div className="space-y-6">
        {/* Personal details */}
        <div className="ks-card p-5">
          <h2 className="font-bold text-sm mb-3">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="ks-field">
              <label>First name</label>
              <input value={profileData.first_name} onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })} />
            </div>
            <div className="ks-field">
              <label>Last name</label>
              <input value={profileData.last_name} onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })} />
            </div>
            <div className="ks-field col-span-full sm:col-span-1">
              <label>Phone number</label>
              <input type="tel" value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="ks-card p-5">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2"><Home className="w-4 h-4" /> Address & Property</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="ks-field col-span-full">
              <label>Address line 1</label>
              <input value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} />
            </div>
            <div className="ks-field col-span-full">
              <label>Address line 2</label>
              <input value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} />
            </div>
            <div className="ks-field">
              <label>City / Town</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="ks-field">
              <label>Postcode</label>
              <input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} />
            </div>
            <div className="ks-field">
              <label>Property type</label>
              <select value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })}>
                <option value="">Select…</option>
                {PROPERTY_TYPES.map((pt) => <option key={pt} value={pt}>{pt}</option>)}
              </select>
            </div>
            <div className="ks-field">
              <label>Parking available?</label>
              <select value={form.parking_available ? "yes" : "no"} onChange={(e) => setForm({ ...form, parking_available: e.target.value === "yes" })}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        </div>

        {/* Funding & Payment */}
        <div className="ks-card p-5">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Funding & Payment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="ks-field">
              <label>Funding type</label>
              <select value={form.funding_type} onChange={(e) => setForm({ ...form, funding_type: e.target.value })}>
                <option value="">Select…</option>
                <option value="self_funded">Self-funded / Private</option>
                <option value="sfe">Student Finance England (SFE/CCG)</option>
                <option value="local_authority">Local Authority (15/30 hrs)</option>
                <option value="employer">Employer Childcare Scheme</option>
              </select>
            </div>
            {form.funding_type === "self_funded" && (
              <div className="ks-field">
                <label>Preferred payment method</label>
                <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                  <option value="">Select…</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="standing_order">Standing Order</option>
                  <option value="childcare_vouchers">Childcare Vouchers</option>
                </select>
              </div>
            )}
            {form.funding_type && form.funding_type !== "self_funded" && (
              <div className="col-span-full">
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
                  💡 KinderStars will invoice the relevant funding body directly. No payment method selection is needed.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pets */}
        <div className="ks-card p-5">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2"><Dog className="w-4 h-4" /> Pets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="ks-field">
              <label>Do you have pets?</label>
              <select value={form.has_pets ? "yes" : "no"} onChange={(e) => setForm({ ...form, has_pets: e.target.value === "yes" })}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            {form.has_pets && (
              <div className="ks-field col-span-full">
                <label>Pet details (type, breed, temperament)</label>
                <textarea value={form.pet_details} onChange={(e) => setForm({ ...form, pet_details: e.target.value })}
                  placeholder="e.g. Friendly labrador, kept in garden during care hours" />
              </div>
            )}
          </div>
        </div>

        {/* Special requirements */}
        <div className="ks-card p-5">
          <div className="ks-field">
            <label>Special requirements or notes for childminders</label>
            <textarea value={form.special_requirements} onChange={(e) => setForm({ ...form, special_requirements: e.target.value })}
              placeholder="Any additional information childminders should know…" />
          </div>
        </div>

        <Button variant="success" onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Profile"}
        </Button>
      </div>
    </div>
  );
};

export default ParentProfile;
