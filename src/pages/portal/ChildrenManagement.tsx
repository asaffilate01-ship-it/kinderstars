import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, X, Baby } from "lucide-react";
import { format } from "date-fns";

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string | null;
  allergies: string | null;
  dietary_requirements: string | null;
  health_issues: string | null;
  special_needs: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

const emptyChild: Omit<Child, "id"> = {
  first_name: "", last_name: "", date_of_birth: "", gender: null,
  allergies: null, dietary_requirements: null, health_issues: null,
  special_needs: null, emergency_contact_name: null, emergency_contact_phone: null,
};

const ChildrenManagement = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [editing, setEditing] = useState<string | null>(null); // id or "new"
  const [form, setForm] = useState<Omit<Child, "id">>(emptyChild);
  const [saving, setSaving] = useState(false);

  const fetchChildren = async () => {
    if (!user) return;
    const { data } = await supabase.from("children").select("*").eq("parent_id", user.id).order("date_of_birth");
    setChildren((data ?? []) as Child[]);
  };

  useEffect(() => { fetchChildren(); }, [user]);

  const startEdit = (child: Child) => {
    setEditing(child.id);
    setForm({
      first_name: child.first_name, last_name: child.last_name,
      date_of_birth: child.date_of_birth, gender: child.gender,
      allergies: child.allergies, dietary_requirements: child.dietary_requirements,
      health_issues: child.health_issues, special_needs: child.special_needs,
      emergency_contact_name: child.emergency_contact_name,
      emergency_contact_phone: child.emergency_contact_phone,
    });
  };

  const startNew = () => {
    setEditing("new");
    setForm(emptyChild);
  };

  const cancel = () => { setEditing(null); setForm(emptyChild); };

  const handleSave = async () => {
    if (!user || !form.first_name || !form.last_name || !form.date_of_birth) {
      toast({ title: "Pflichtfelder fehlen", description: "Vorname, Nachname und Geburtsdatum sind erforderlich.", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (editing === "new") {
      const { error } = await supabase.from("children").insert({ ...form, parent_id: user.id });
      if (error) { toast({ title: "Fehler", description: error.message, variant: "destructive" }); setSaving(false); return; }
      toast({ title: "Kind hinzugefügt" });
    } else {
      const { error } = await supabase.from("children").update(form).eq("id", editing!);
      if (error) { toast({ title: "Fehler", description: error.message, variant: "destructive" }); setSaving(false); return; }
      toast({ title: "Kind aktualisiert" });
    }
    setSaving(false);
    setEditing(null);
    setForm(emptyChild);
    fetchChildren();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Dieses Kind entfernen?")) return;
    await supabase.from("children").delete().eq("id", id);
    toast({ title: "Kind entfernt" });
    fetchChildren();
    if (editing === id) cancel();
  };

  const getAge = (dob: string) => {
    const years = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return years < 1 ? "Unter 1 Jahr" : `${years} J.`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Kinder</h1>
          <p className="text-muted-foreground text-sm">Verwalten Sie die Profile, Gesundheits- und Allergieinformationen Ihrer Kinder.</p>
        </div>
        {!editing && (
          <Button variant="hero" size="sm" className="gap-1.5" onClick={startNew}>
            <Plus className="w-4 h-4" /> Kind hinzufügen
          </Button>
        )}
      </div>

      {/* Edit/Add form */}
      {editing && (
        <div className="ks-card p-5 mb-6">
          <h2 className="font-bold text-sm mb-3">{editing === "new" ? "Kind hinzufügen" : "Kind bearbeiten"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="ks-field"><label>Vorname *</label>
              <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div className="ks-field"><label>Nachname *</label>
              <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <div className="ks-field"><label>Geburtsdatum *</label>
              <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            </div>
            <div className="ks-field"><label>Geschlecht</label>
              <select value={form.gender || ""} onChange={(e) => setForm({ ...form, gender: e.target.value || null })}>
                <option value="">Keine Angabe</option>
                <option value="male">Männlich</option>
                <option value="female">Weiblich</option>
                <option value="other">Divers</option>
              </select>
            </div>
            <div className="ks-field col-span-full"><label>Allergien</label>
              <textarea value={form.allergies || ""} onChange={(e) => setForm({ ...form, allergies: e.target.value || null })}
                placeholder="Bekannte Allergien angeben (Lebensmittel, Umwelt, Medikamente)…" />
            </div>
            <div className="ks-field col-span-full"><label>Ernährungsbedürfnisse</label>
              <input value={form.dietary_requirements || ""} onChange={(e) => setForm({ ...form, dietary_requirements: e.target.value || null })}
                placeholder="z. B. vegetarisch, halal, glutenfrei" />
            </div>
            <div className="ks-field col-span-full"><label>Gesundheitliche Hinweise</label>
              <textarea value={form.health_issues || ""} onChange={(e) => setForm({ ...form, health_issues: e.target.value || null })}
                placeholder="Erkrankungen, Medikamente oder laufende Behandlungen…" />
            </div>
            <div className="ks-field col-span-full"><label>Förderbedarf / besondere Unterstützung</label>
              <textarea value={form.special_needs || ""} onChange={(e) => setForm({ ...form, special_needs: e.target.value || null })}
                placeholder="Inklusion, Verhaltens- oder Entwicklungsbesonderheiten…" />
            </div>
            <div className="ks-field"><label>Notfallkontakt (Name)</label>
              <input value={form.emergency_contact_name || ""} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value || null })} />
            </div>
            <div className="ks-field"><label>Notfallkontakt (Telefon)</label>
              <input type="tel" value={form.emergency_contact_phone || ""} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value || null })} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="success" size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
              <Save className="w-4 h-4" /> {saving ? "Speichern…" : "Speichern"}
            </Button>
            <Button variant="ghost" size="sm" onClick={cancel} className="gap-1.5">
              <X className="w-4 h-4" /> Abbrechen
            </Button>
          </div>
        </div>
      )}

      {/* Children list */}
      <div className="space-y-3">
        {children.length === 0 && !editing ? (
          <div className="ks-card p-8 text-center">
            <Baby className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Noch keine Kinder angelegt.</p>
            <Button variant="warm" size="sm" className="mt-3 gap-1.5" onClick={startNew}>
              <Plus className="w-4 h-4" /> Erstes Kind hinzufügen
            </Button>
          </div>
        ) : children.map((child) => (
          <div key={child.id} className="ks-card p-4 flex flex-col sm:flex-row sm:items-start gap-3">
            <div className="flex-1">
              <div className="font-bold text-sm">{child.first_name} {child.last_name}
                <span className="text-xs text-muted-foreground ml-2">{getAge(child.date_of_birth)} • {format(new Date(child.date_of_birth), "dd MMM yyyy")}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                {child.allergies && <span className="ks-tag border-destructive/30 text-destructive">⚠ Allergien: {child.allergies}</span>}
                {child.dietary_requirements && <span className="ks-tag">🍽 {child.dietary_requirements}</span>}
                {child.health_issues && <span className="ks-tag border-primary/30">🏥 Gesundheitshinweise</span>}
                {child.special_needs && <span className="ks-tag border-secondary/30">♿ Förderbedarf</span>}
              </div>
              {child.emergency_contact_name && (
                <div className="text-xs text-muted-foreground mt-2">
                  Notfall: {child.emergency_contact_name} ({child.emergency_contact_phone || "—"})
                </div>
              )}
            </div>
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => startEdit(child)}><Pencil className="w-3.5 h-3.5" /></Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(child.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChildrenManagement;
