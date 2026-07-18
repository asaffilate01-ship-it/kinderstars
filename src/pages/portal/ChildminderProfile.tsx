import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Camera, Save, Loader2 } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const AGE_GROUPS = ["0-1", "2-4", "5-8", "9-12"];

interface ProfileData {
  postcode_district: string;
  town: string;
  max_distance_miles: number;
  max_children: number;
  age_groups: string[];
  experience_years: number | null;
  bio: string;
  hours: string;
  days: string[];
  languages: string[];
  ofsted_urn: string;
  ofsted_rating: string;
  ofsted_last_inspection: string;
  dbs_number: string;
  dbs_issue_date: string;
  insurance_provider: string;
  insurance_expiry: string;
  first_aid_expiry: string;
  next_of_kin_name: string;
  next_of_kin_phone: string;
  next_of_kin_relation: string;
  is_available: boolean;
}

const empty: ProfileData = {
  postcode_district: "", town: "", max_distance_miles: 10, max_children: 3,
  age_groups: [], experience_years: null, bio: "", hours: "", days: [], languages: [],
  ofsted_urn: "", ofsted_rating: "", ofsted_last_inspection: "",
  dbs_number: "", dbs_issue_date: "",
  insurance_provider: "", insurance_expiry: "", first_aid_expiry: "",
  next_of_kin_name: "", next_of_kin_phone: "", next_of_kin_relation: "",
  is_available: true,
};

const ChildminderProfile = () => {
  const { user } = useAuth();
  const [form, setForm] = useState<ProfileData>(empty);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    setLoadingProfile(true);

    // Load profile avatar
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);

    // Load childminder profile
    const { data } = await supabase
      .from("childminder_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setForm({
        postcode_district: data.postcode_district || "",
        town: data.town || "",
        max_distance_miles: data.max_distance_miles ?? 10,
        max_children: data.max_children ?? 3,
        age_groups: data.age_groups || [],
        experience_years: data.experience_years,
        bio: data.bio || "",
        hours: data.hours || "",
        days: data.days || [],
        languages: data.languages || [],
        ofsted_urn: data.ofsted_urn || "",
        ofsted_rating: data.ofsted_rating || "",
        ofsted_last_inspection: data.ofsted_last_inspection || "",
        dbs_number: data.dbs_number || "",
        dbs_issue_date: data.dbs_issue_date || "",
        insurance_provider: data.insurance_provider || "",
        insurance_expiry: data.insurance_expiry || "",
        first_aid_expiry: data.first_aid_expiry || "",
        next_of_kin_name: data.next_of_kin_name || "",
        next_of_kin_phone: data.next_of_kin_phone || "",
        next_of_kin_relation: data.next_of_kin_relation || "",
        is_available: data.is_available ?? true,
      });
    }
    setLoadingProfile(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    const path = `${user.id}/avatar.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
    setAvatarUrl(publicUrl + "?t=" + Date.now());
    setUploading(false);
    toast({ title: "Photo updated" });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      postcode_district: form.postcode_district || null,
      town: form.town || null,
      max_distance_miles: form.max_distance_miles,
      max_children: form.max_children,
      age_groups: form.age_groups,
      experience_years: form.experience_years,
      bio: form.bio || null,
      hours: form.hours || null,
      days: form.days,
      languages: form.languages,
      ofsted_urn: form.ofsted_urn || null,
      ofsted_rating: form.ofsted_rating || null,
      ofsted_last_inspection: form.ofsted_last_inspection || null,
      dbs_number: form.dbs_number || null,
      dbs_issue_date: form.dbs_issue_date || null,
      insurance_provider: form.insurance_provider || null,
      insurance_expiry: form.insurance_expiry || null,
      first_aid_expiry: form.first_aid_expiry || null,
      next_of_kin_name: form.next_of_kin_name || null,
      next_of_kin_phone: form.next_of_kin_phone || null,
      next_of_kin_relation: form.next_of_kin_relation || null,
      is_available: form.is_available,
    };

    const { data: existing } = await supabase
      .from("childminder_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase.from("childminder_profiles").update(payload).eq("user_id", user.id));
    } else {
      ({ error } = await supabase.from("childminder_profiles").insert(payload));
    }

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved" });
    }
  };

  const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  if (loadingProfile) return <div className="text-muted-foreground">Loading profile…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground text-sm">Manage your childminder profile, qualifications, and details.</p>
      </div>

      {/* Avatar */}
      <div className="ks-card p-5 flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs hover:opacity-90"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div>
          <p className="font-bold text-sm">Profile Photo</p>
          <p className="text-muted-foreground text-xs">JPG, PNG up to 5MB</p>
        </div>
      </div>

      {/* Location & Preferences */}
      <div className="ks-card p-5">
        <h2 className="font-bold mb-3">Location & Preferences</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="ks-field">
            <label>Town/City</label>
            <input value={form.town} onChange={(e) => setForm({ ...form, town: e.target.value })} />
          </div>
          <div className="ks-field">
            <label>Postcode District</label>
            <input placeholder="e.g. LU1" value={form.postcode_district} onChange={(e) => setForm({ ...form, postcode_district: e.target.value })} />
          </div>
          <div className="ks-field">
            <label>Max Distance (miles)</label>
            <input type="number" min={1} max={100} value={form.max_distance_miles} onChange={(e) => setForm({ ...form, max_distance_miles: Number(e.target.value) })} />
          </div>
          <div className="ks-field">
            <label>Max Children at Once</label>
            <input type="number" min={1} max={20} value={form.max_children} onChange={(e) => setForm({ ...form, max_children: Number(e.target.value) })} />
          </div>
          <div className="ks-field">
            <label>Working Hours</label>
            <input placeholder="e.g. 08:00–18:00" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
          </div>
          <div className="ks-field">
            <label>Experience (years)</label>
            <input type="number" min={0} value={form.experience_years ?? ""} onChange={(e) => setForm({ ...form, experience_years: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div className="ks-field col-span-2">
            <label>Languages (comma separated)</label>
            <input value={form.languages.join(", ")} onChange={(e) => setForm({ ...form, languages: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-muted-foreground mb-1.5">Age Groups</label>
            <div className="flex gap-2 flex-wrap">
              {AGE_GROUPS.map((ag) => (
                <button key={ag} type="button" onClick={() => setForm({ ...form, age_groups: toggleArr(form.age_groups, ag) })}
                  className={`ks-tag cursor-pointer ${form.age_groups.includes(ag) ? "!bg-primary/20 !border-primary/50 font-bold" : ""}`}>
                  {ag}
                </button>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-muted-foreground mb-1.5">Days Available</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((d) => (
                <button key={d} type="button" onClick={() => setForm({ ...form, days: toggleArr(form.days, d) })}
                  className={`ks-tag cursor-pointer ${form.days.includes(d) ? "!bg-primary/20 !border-primary/50 font-bold" : ""}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="ks-field col-span-2">
            <label>Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell parents about your childcare approach…" />
          </div>
          <div className="col-span-2 flex items-center gap-3">
            <label className="text-xs text-muted-foreground">Available for work</label>
            <button
              type="button"
              onClick={() => setForm({ ...form, is_available: !form.is_available })}
              className={`w-12 h-6 rounded-full transition-colors relative ${form.is_available ? "bg-success" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform ${form.is_available ? "left-6" : "left-0.5"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Ofsted Details */}
      <div className="ks-card p-5">
        <h2 className="font-bold mb-3">Ofsted Details</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="ks-field">
            <label>Ofsted URN</label>
            <input value={form.ofsted_urn} onChange={(e) => setForm({ ...form, ofsted_urn: e.target.value })} />
          </div>
          <div className="ks-field">
            <label>Ofsted Rating</label>
            <select value={form.ofsted_rating} onChange={(e) => setForm({ ...form, ofsted_rating: e.target.value })}>
              <option value="">Select…</option>
              <option value="Outstanding">Outstanding</option>
              <option value="Good">Good</option>
              <option value="Requires Improvement">Requires Improvement</option>
              <option value="Inadequate">Inadequate</option>
              <option value="Not Yet Inspected">Not Yet Inspected</option>
            </select>
          </div>
          <div className="ks-field">
            <label>Last Inspection Date</label>
            <input type="date" value={form.ofsted_last_inspection} onChange={(e) => setForm({ ...form, ofsted_last_inspection: e.target.value })} />
          </div>
        </div>
      </div>

      {/* DBS & Insurance */}
      <div className="ks-card p-5">
        <h2 className="font-bold mb-3">DBS & Insurance</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="ks-field">
            <label>DBS Certificate Number</label>
            <input value={form.dbs_number} onChange={(e) => setForm({ ...form, dbs_number: e.target.value })} />
          </div>
          <div className="ks-field">
            <label>DBS Issue Date</label>
            <input type="date" value={form.dbs_issue_date} onChange={(e) => setForm({ ...form, dbs_issue_date: e.target.value })} />
          </div>
          <div className="ks-field">
            <label>Insurance Provider</label>
            <input value={form.insurance_provider} onChange={(e) => setForm({ ...form, insurance_provider: e.target.value })} />
          </div>
          <div className="ks-field">
            <label>Insurance Expiry</label>
            <input type="date" value={form.insurance_expiry} onChange={(e) => setForm({ ...form, insurance_expiry: e.target.value })} />
          </div>
          <div className="ks-field">
            <label>First Aid Expiry</label>
            <input type="date" value={form.first_aid_expiry} onChange={(e) => setForm({ ...form, first_aid_expiry: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Next of Kin */}
      <div className="ks-card p-5">
        <h2 className="font-bold mb-3">Next of Kin</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="ks-field">
            <label>Full Name</label>
            <input value={form.next_of_kin_name} onChange={(e) => setForm({ ...form, next_of_kin_name: e.target.value })} />
          </div>
          <div className="ks-field">
            <label>Phone Number</label>
            <input type="tel" value={form.next_of_kin_phone} onChange={(e) => setForm({ ...form, next_of_kin_phone: e.target.value })} />
          </div>
          <div className="ks-field">
            <label>Relationship</label>
            <input placeholder="e.g. Spouse, Parent" value={form.next_of_kin_relation} onChange={(e) => setForm({ ...form, next_of_kin_relation: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="hero" onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Profile"}
        </Button>
      </div>
    </div>
  );
};

export default ChildminderProfile;
