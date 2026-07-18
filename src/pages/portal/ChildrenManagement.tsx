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
      toast({ title: "Missing fields", description: "First name, last name, and date of birth are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (editing === "new") {
      const { error } = await supabase.from("children").insert({ ...form, parent_id: user.id });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
      toast({ title: "Child added" });
    } else {
      const { error } = await supabase.from("children").update(form).eq("id", editing!);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
      toast({ title: "Child updated" });
    }
    setSaving(false);
    setEditing(null);
    setForm(emptyChild);
    fetchChildren();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this child?")) return;
    await supabase.from("children").delete().eq("id", id);
    toast({ title: "Child removed" });
    fetchChildren();
    if (editing === id) cancel();
  };

  const getAge = (dob: string) => {
    const years = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return years < 1 ? "Under 1" : `${years}y`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Children</h1>
          <p className="text-muted-foreground text-sm">Manage your children's profiles, health, and allergy information.</p>
        </div>
        {!editing && (
          <Button variant="hero" size="sm" className="gap-1.5" onClick={startNew}>
            <Plus className="w-4 h-4" /> Add Child
          </Button>
        )}
      </div>

      {/* Edit/Add form */}
      {editing && (
        <div className="ks-card p-5 mb-6">
          <h2 className="font-bold text-sm mb-3">{editing === "new" ? "Add Child" : "Edit Child"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="ks-field"><label>First name *</label>
              <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div className="ks-field"><label>Last name *</label>
              <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <div className="ks-field"><label>Date of birth *</label>
              <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            </div>
            <div className="ks-field"><label>Gender</label>
              <select value={form.gender || ""} onChange={(e) => setForm({ ...form, gender: e.target.value || null })}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="ks-field col-span-full"><label>Allergies</label>
              <textarea value={form.allergies || ""} onChange={(e) => setForm({ ...form, allergies: e.target.value || null })}
                placeholder="List any known allergies (food, environmental, medication)…" />
            </div>
            <div className="ks-field col-span-full"><label>Dietary requirements</label>
              <input value={form.dietary_requirements || ""} onChange={(e) => setForm({ ...form, dietary_requirements: e.target.value || null })}
                placeholder="e.g. Vegetarian, halal, gluten-free" />
            </div>
            <div className="ks-field col-span-full"><label>Health issues</label>
              <textarea value={form.health_issues || ""} onChange={(e) => setForm({ ...form, health_issues: e.target.value || null })}
                placeholder="Any medical conditions, medications, or ongoing treatments…" />
            </div>
            <div className="ks-field col-span-full"><label>Special needs / additional support</label>
              <textarea value={form.special_needs || ""} onChange={(e) => setForm({ ...form, special_needs: e.target.value || null })}
                placeholder="SEND, behavioural needs, or developmental considerations…" />
            </div>
            <div className="ks-field"><label>Emergency contact name</label>
              <input value={form.emergency_contact_name || ""} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value || null })} />
            </div>
            <div className="ks-field"><label>Emergency contact phone</label>
              <input type="tel" value={form.emergency_contact_phone || ""} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value || null })} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="success" size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
              <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
            </Button>
            <Button variant="ghost" size="sm" onClick={cancel} className="gap-1.5">
              <X className="w-4 h-4" /> Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Children list */}
      <div className="space-y-3">
        {children.length === 0 && !editing ? (
          <div className="ks-card p-8 text-center">
            <Baby className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No children added yet.</p>
            <Button variant="warm" size="sm" className="mt-3 gap-1.5" onClick={startNew}>
              <Plus className="w-4 h-4" /> Add your first child
            </Button>
          </div>
        ) : children.map((child) => (
          <div key={child.id} className="ks-card p-4 flex flex-col sm:flex-row sm:items-start gap-3">
            <div className="flex-1">
              <div className="font-bold text-sm">{child.first_name} {child.last_name}
                <span className="text-xs text-muted-foreground ml-2">{getAge(child.date_of_birth)} • {format(new Date(child.date_of_birth), "dd MMM yyyy")}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                {child.allergies && <span className="ks-tag border-destructive/30 text-destructive">⚠ Allergies: {child.allergies}</span>}
                {child.dietary_requirements && <span className="ks-tag">🍽 {child.dietary_requirements}</span>}
                {child.health_issues && <span className="ks-tag border-primary/30">🏥 Health notes</span>}
                {child.special_needs && <span className="ks-tag border-secondary/30">♿ SEND</span>}
              </div>
              {child.emergency_contact_name && (
                <div className="text-xs text-muted-foreground mt-2">
                  Emergency: {child.emergency_contact_name} ({child.emergency_contact_phone || "—"})
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
