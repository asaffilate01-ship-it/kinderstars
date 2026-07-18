import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Loader2, Shield, Users, Baby } from "lucide-react";

import { Crown, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";

const ALL_ROLES = [
  { value: "owner", label: "Owner", icon: Crown, desc: "Super-admin, full platform control", ownerOnly: true },
  { value: "admin", label: "Admin", icon: Shield, desc: "Full system access" },
  { value: "childminder", label: "Childminder", icon: Users, desc: "Manage shifts, bookings, timesheets" },
  { value: "parent", label: "Parent", icon: Baby, desc: "Book childminders, manage children" },
];

const AdminCreateUser = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const isOwner = userRole === "owner";
  const ROLES = ALL_ROLES.filter((r) => !r.ownerOnly || isOwner);
  
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "admin",
  });
  const [creating, setCreating] = useState(false);
  const [createdUsers, setCreatedUsers] = useState<{ email: string; role: string; created_at: string }[]>([]);

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.first_name) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setCreating(true);

    // Use edge function to create user (admin privilege)
    const { data, error } = await supabase.functions.invoke("create-user", {
      body: {
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        role: form.role,
      },
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data?.error) {
      toast({ title: "Error", description: data.error, variant: "destructive" });
    } else {
      toast({ title: "User created!", description: `${form.email} (${form.role})` });
      setCreatedUsers((prev) => [{ email: form.email, role: form.role, created_at: new Date().toISOString() }, ...prev]);
      setForm({ email: "", password: "", first_name: "", last_name: "", role: "admin" });
    }

    setCreating(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/dashboard")} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create User Account</h1>
          <p className="text-muted-foreground text-sm">Create new admin, childminder, or parent accounts.</p>
        </div>
      </div>

      <div className="ks-card p-5 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-1.5"><UserPlus className="w-4 h-4" /> New Account</h3>

        {/* Role selection */}
        <div>
          <label className="text-xs text-muted-foreground block mb-2">Account Role</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => setForm({ ...form, role: r.value })}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  form.role === r.value
                    ? "border-secondary bg-secondary/10"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <r.icon className="w-4 h-4" />
                  <span className="font-bold text-sm">{r.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">First Name *</label>
            <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="First name" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Last Name</label>
            <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Last name" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Email *</label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@example.com" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Password *</label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
          </div>
        </div>

        <Button variant="warm" onClick={handleCreate} disabled={creating} className="gap-1.5">
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Create {ROLES.find((r) => r.value === form.role)?.label} Account
        </Button>
      </div>

      {/* Recently created */}
      {createdUsers.length > 0 && (
        <div className="ks-card p-4">
          <h3 className="font-bold text-sm mb-2">Recently Created</h3>
          {createdUsers.map((u, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
              <span>{u.email}</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                u.role === "admin" ? "bg-destructive/10 text-destructive" :
                u.role === "childminder" ? "bg-secondary/10 text-secondary" :
                "bg-primary/10 text-foreground"
              }`}>{u.role}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCreateUser;
