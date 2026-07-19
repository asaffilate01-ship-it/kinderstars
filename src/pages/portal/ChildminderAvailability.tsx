import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Save, Loader2, Plus, Trash2 } from "lucide-react";

const DAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

interface Slot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const ChildminderAvailability = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadSlots();
  }, [user]);

  const loadSlots = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("availability")
      .select("*")
      .eq("user_id", user.id)
      .order("day_of_week")
      .order("start_time");
    setSlots((data ?? []).map((d) => ({
      id: d.id,
      day_of_week: d.day_of_week,
      start_time: d.start_time,
      end_time: d.end_time,
      is_available: d.is_available ?? true,
    })));
    setLoading(false);
  };

  const addSlot = (day: number) => {
    setSlots([...slots, { day_of_week: day, start_time: "08:00", end_time: "18:00", is_available: true }]);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof Slot, value: string | boolean) => {
    setSlots(slots.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    // Delete existing and re-insert
    await supabase.from("availability").delete().eq("user_id", user.id);

    if (slots.length > 0) {
      const rows = slots.map((s) => ({
        user_id: user.id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        is_available: s.is_available,
      }));
      const { error } = await supabase.from("availability").insert(rows);
      if (error) {
        toast({ title: "Fehler", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    toast({ title: "Verfügbarkeit gespeichert" });
    setSaving(false);
    loadSlots();
  };

  if (loading) return <div className="text-muted-foreground">Wird geladen…</div>;

  // Group by day
  const groupedByDay = DAY_NAMES.map((name, dayIndex) => ({
    name,
    dayIndex,
    daySlots: slots
      .map((s, origIndex) => ({ ...s, origIndex }))
      .filter((s) => s.day_of_week === dayIndex),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verfügbarkeit</h1>
        <p className="text-muted-foreground text-sm">Legen Sie Ihre wöchentliche Verfügbarkeit fest, damit Anfragen und Schichten zugeordnet werden können.</p>
      </div>

      <div className="space-y-3">
        {groupedByDay.map((day) => (
          <div key={day.dayIndex} className="ks-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm">{day.name}</h3>
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => addSlot(day.dayIndex)}>
                <Plus className="w-3.5 h-3.5" /> Zeitfenster hinzufügen
              </Button>
            </div>
            {day.daySlots.length === 0 ? (
              <p className="text-xs text-muted-foreground">Keine Verfügbarkeit – freier Tag</p>
            ) : (
              <div className="space-y-2">
                {day.daySlots.map((slot) => (
                  <div key={slot.origIndex} className="flex items-center gap-2 flex-wrap">
                    <div className="ks-field flex-1 min-w-[100px]">
                      <input
                        type="time"
                        value={slot.start_time}
                        onChange={(e) => updateSlot(slot.origIndex, "start_time", e.target.value)}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">bis</span>
                    <div className="ks-field flex-1 min-w-[100px]">
                      <input
                        type="time"
                        value={slot.end_time}
                        onChange={(e) => updateSlot(slot.origIndex, "end_time", e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => updateSlot(slot.origIndex, "is_available", !slot.is_available)}
                      className={`ks-tag cursor-pointer text-[11px] ${slot.is_available ? "!bg-success/15 !border-success/30 !text-success" : "!bg-destructive/15 !border-destructive/30 !text-destructive"}`}
                    >
                      {slot.is_available ? "Verfügbar" : "Gesperrt"}
                    </button>
                    <button onClick={() => removeSlot(slot.origIndex)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Button variant="hero" onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "Speichern…" : "Verfügbarkeit speichern"}
      </Button>
    </div>
  );
};

export default ChildminderAvailability;
