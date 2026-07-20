import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Childminder, rowToChildminder, childminderToRow } from "@/lib/childminder-data";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/kinderstars-logo.png";
import { z } from "zod";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const AGE_GROUPS = ["0-1", "2-4", "5-8"] as const;

const childminderSchema = z.object({
  id: z.string().trim().min(1, "Referenz-ID erforderlich").max(30, "ID zu lang"),
  firstName: z.string().trim().min(1, "Vorname erforderlich").max(50, "Vorname zu lang").regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Ungültige Zeichen im Namen"),
  lastInitial: z.string().trim().min(1, "Anfangsbuchstabe des Nachnamens erforderlich").max(2, "Max. 2 Zeichen").regex(/^[a-zA-ZÀ-ÿ]+$/, "Nur Buchstaben erlaubt"),
  town: z.string().trim().min(1, "Stadt erforderlich").max(100, "Stadtname zu lang"),
  postcodeDistrict: z.string().trim().min(2, "PLZ‑Bereich erforderlich").max(5, "PLZ zu lang").regex(/^\d{2,5}$/, "Ungültige PLZ (z. B. 10115 oder 101)"),
  verified: z.boolean(),
  ageGroups: z.array(z.enum(AGE_GROUPS)),
  days: z.array(z.enum(DAYS)),
  hours: z.string().max(50, "Stundenangabe zu lang").optional().or(z.literal("")),
  languages: z.array(z.string().trim().max(30)).max(10, "Zu viele Sprachen"),
  experienceYears: z.number().int().min(0).max(50).nullable(),
  bio: z.string().max(500, "Kurzprofil darf max. 500 Zeichen haben").optional().or(z.literal("")),
});

const emptyForm: Childminder = {
  id: "", firstName: "", lastInitial: "", town: "", postcodeDistrict: "",
  verified: false, verificationTier: "registered", ageGroups: [], days: [], hours: "", languages: [],
  experienceYears: null, bio: "",
};




const AdminPanel = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [childminders, setChildminders] = useState<Childminder[]>([]);
  const [form, setForm] = useState<Childminder>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/admin/login");
    }
  }, [loading, user, isAdmin, navigate]);

  useEffect(() => {
    fetchChildminders();
  }, []);

  const fetchChildminders = async () => {
    const { data } = await supabase.from("childminders").select("*").order("created_at", { ascending: false });
    setChildminders((data ?? []).map(rowToChildminder));
  };

  const handleSave = async () => {
    const result = childminderSchema.safeParse(form);
    if (!result.success) {
      const firstError = result.error.errors[0];
      toast({ title: "Validierungsfehler", description: firstError.message, variant: "destructive" });
      return;
    }
    setSaving(true);
    const row = childminderToRow(form);

    if (editingId) {
      const { error } = await supabase.from("childminders").update(row).eq("id", editingId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
      if (editingId !== form.id) {
        // ID changed — delete old
        await supabase.from("childminders").delete().eq("id", editingId);
      }
    } else {
      const { error } = await supabase.from("childminders").insert(row);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
    }

    toast({ title: editingId ? "Updated" : "Added", description: `${form.firstName} ${form.lastInitial}. saved.` });
    setForm(emptyForm);
    setEditingId(null);
    setSaving(false);
    fetchChildminders();
    queryClient.invalidateQueries({ queryKey: ["childminders"] });
  };

  const handleEdit = (cm: Childminder) => {
    setForm(cm);
    setEditingId(cm.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this childminder?")) return;
    await supabase.from("childminders").delete().eq("id", id);
    toast({ title: "Deleted" });
    fetchChildminders();
    queryClient.invalidateQueries({ queryKey: ["childminders"] });
    if (editingId === id) { setForm(emptyForm); setEditingId(null); }
  };

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-border bg-background/82">
        <div className="max-w-[1120px] mx-auto px-6 py-3 flex items-center justify-between">
          <a href="/"><img src={logo} alt="KinderStars" className="w-[140px]" /></a>
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" asChild><a href="/admin/dashboard">Dashboard</a></Button>
            <Button variant="ghost" size="sm" asChild><a href="/admin/roster">Roster</a></Button>
            <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>Sign out</Button>
            <Button variant="ghost" size="sm" asChild><a href="/">← Website</a></Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1120px] mx-auto px-6 py-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Admin: Childminder Directory</h1>
        <p className="text-muted-foreground text-sm mb-5">Add, edit, and remove childminder profiles. Changes are live instantly.</p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
          {/* Form */}
          <div className="ks-card p-5">
            <h2 className="font-bold mb-3">{editingId ? "Edit childminder" : "Add new childminder"}</h2>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="ks-field">
                <label>Reference ID</label>
                <input placeholder="z. B. KS-10115-005" value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} />
              </div>
              <div className="ks-field">
                <label>Verified</label>
                <select value={form.verified ? "true" : "false"} onChange={e => setForm({ ...form, verified: e.target.value === "true" })}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div className="ks-field">
                <label>First name</label>
                <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="ks-field">
                <label>Last initial</label>
                <input maxLength={2} value={form.lastInitial} onChange={e => setForm({ ...form, lastInitial: e.target.value })} />
              </div>
              <div className="ks-field">
                <label>Town/City</label>
                <input value={form.town} onChange={e => setForm({ ...form, town: e.target.value })} />
              </div>
              <div className="ks-field">
                <label>Postcode district</label>
                <input placeholder="z. B. 10115" value={form.postcodeDistrict} onChange={e => setForm({ ...form, postcodeDistrict: e.target.value })} />
              </div>
              <div className="ks-field">
                <label>Hours</label>
                <input placeholder="z. B. 08:00–18:00" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} />
              </div>
              <div className="ks-field">
                <label>Experience (years)</label>
                <input type="number" min="0" value={form.experienceYears ?? ""} onChange={e => setForm({ ...form, experienceYears: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div className="ks-field col-span-2">
                <label>Languages (comma separated)</label>
                <input value={form.languages.join(", ")} onChange={e => setForm({ ...form, languages: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} />
              </div>

              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1.5">Age groups</label>
                <div className="flex gap-2 flex-wrap">
                  {AGE_GROUPS.map(ag => (
                    <button key={ag} type="button" onClick={() => setForm({ ...form, ageGroups: toggleArray(form.ageGroups, ag) })}
                      className={`ks-tag cursor-pointer ${form.ageGroups.includes(ag) ? "!bg-brand-accent/20 !border-brand-accent/50 font-bold" : ""}`}>
                      {ag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1.5">Days available</label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map(d => (
                    <button key={d} type="button" onClick={() => setForm({ ...form, days: toggleArray(form.days, d) })}
                      className={`ks-tag cursor-pointer ${form.days.includes(d) ? "!bg-brand-accent/20 !border-brand-accent/50 font-bold" : ""}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ks-field col-span-2">
                <label>Short bio</label>
                <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Herzliche, spielorientierte Kindertagespflege…" />
              </div>
            </div>

            <div className="flex gap-2.5 flex-wrap mt-3">
              <Button variant="success" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : editingId ? "Update" : "Save"}</Button>
              <Button variant="ghost" onClick={() => { setForm(emptyForm); setEditingId(null); }}>Clear</Button>
              {editingId && <Button variant="destructive" onClick={() => handleDelete(editingId)}>Delete</Button>}
            </div>
          </div>

          {/* List */}
          <div className="ks-card p-5">
            <h2 className="font-bold mb-3">Current profiles ({childminders.length})</h2>
            <div className="space-y-2.5 max-h-[70vh] overflow-y-auto">
              {childminders.length === 0 ? (
                <p className="text-muted-foreground text-sm">No childminders yet.</p>
              ) : childminders.map(cm => (
                <div key={cm.id} className="border border-border rounded-xl p-3 bg-white/70 flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm">{cm.firstName} {cm.lastInitial}. <span className="font-mono text-muted-foreground/60 text-xs">({cm.id})</span></div>
                    <div className="text-muted-foreground text-xs">{cm.postcodeDistrict} • {cm.town} • {cm.verified ? "Verified" : "Listed"}</div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(cm)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(cm.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
