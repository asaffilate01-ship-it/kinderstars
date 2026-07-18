import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await callerClient.from("user_roles").select("role").eq("user_id", caller.id).maybeSingle();
    const callerRole = roleData?.role;
    if (callerRole !== "admin" && callerRole !== "owner") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, user_id } = body;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Helper to log audit
    const logAudit = async (actionName: string, targetUserId: string | null, targetEmail: string | null, details: Record<string, unknown> = {}) => {
      await adminClient.from("admin_audit_log").insert({
        admin_id: caller.id,
        admin_email: caller.email,
        action: actionName,
        target_user_id: targetUserId,
        target_email: targetEmail,
        details,
      });
    };

    // ── BULK ACTIONS ──
    if (action === "bulk_delete") {
      const { user_ids } = body;
      if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
        return new Response(JSON.stringify({ error: "No users selected" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const results: { user_id: string; success: boolean; error?: string }[] = [];
      for (const uid of user_ids) {
        if (uid === caller.id) { results.push({ user_id: uid, success: false, error: "Cannot delete yourself" }); continue; }
        const { data: targetRole } = await adminClient.from("user_roles").select("role").eq("user_id", uid).maybeSingle();
        if (targetRole?.role === "owner" && callerRole !== "owner") { results.push({ user_id: uid, success: false, error: "Only owners can delete owners" }); continue; }
        const { error } = await adminClient.auth.admin.deleteUser(uid);
        if (error) { results.push({ user_id: uid, success: false, error: error.message }); }
        else {
          await logAudit("bulk_delete_user", uid, null, {});
          results.push({ user_id: uid, success: true });
        }
      }
      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "bulk_change_role") {
      const { user_ids, role } = body;
      if (!user_ids || !Array.isArray(user_ids) || !role) {
        return new Response(JSON.stringify({ error: "Missing user_ids or role" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const validRoles = ["admin", "user", "childminder", "parent", "owner"];
      if (!validRoles.includes(role)) {
        return new Response(JSON.stringify({ error: "Invalid role" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (role === "owner" && callerRole !== "owner") {
        return new Response(JSON.stringify({ error: "Only owners can assign owner role" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      for (const uid of user_ids) {
        const { data: existingRole } = await adminClient.from("user_roles").select("id").eq("user_id", uid).maybeSingle();
        if (existingRole) {
          await adminClient.from("user_roles").update({ role }).eq("user_id", uid);
        } else {
          await adminClient.from("user_roles").insert({ user_id: uid, role });
        }
        await adminClient.from("profiles").update({ role }).eq("user_id", uid);
        await logAudit("bulk_change_role", uid, null, { new_role: role });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!user_id || !action) {
      return new Response(JSON.stringify({ error: "Missing user_id or action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent non-owners from modifying owners
    const { data: targetRole } = await adminClient.from("user_roles").select("role").eq("user_id", user_id).maybeSingle();
    if (targetRole?.role === "owner" && callerRole !== "owner") {
      return new Response(JSON.stringify({ error: "Only owners can manage owner accounts" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get target email for logging
    const { data: targetProfile } = await adminClient.from("profiles").select("email").eq("user_id", user_id).maybeSingle();
    const targetEmail = targetProfile?.email || null;

    // ── UPDATE PROFILE ──
    if (action === "update_profile") {
      const { first_name, last_name, email, phone } = body;
      const updates: Record<string, unknown> = {};
      if (first_name !== undefined) updates.first_name = first_name;
      if (last_name !== undefined) updates.last_name = last_name;
      if (email !== undefined) updates.email = email;
      if (phone !== undefined) updates.phone = phone;

      if (Object.keys(updates).length === 0) {
        return new Response(JSON.stringify({ error: "No fields to update" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await adminClient.from("profiles").update(updates).eq("user_id", user_id);
      if (error) throw error;

      if (email) {
        await adminClient.auth.admin.updateUserById(user_id, { email });
      }

      await logAudit("update_profile", user_id, targetEmail, updates);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── CHANGE ROLE ──
    if (action === "change_role") {
      const { role } = body;
      const validRoles = ["admin", "user", "childminder", "parent", "owner"];
      if (!validRoles.includes(role)) {
        return new Response(JSON.stringify({ error: "Invalid role" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (role === "owner" && callerRole !== "owner") {
        return new Response(JSON.stringify({ error: "Only owners can assign owner role" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existingRole } = await adminClient.from("user_roles").select("id").eq("user_id", user_id).maybeSingle();
      if (existingRole) {
        await adminClient.from("user_roles").update({ role }).eq("user_id", user_id);
      } else {
        await adminClient.from("user_roles").insert({ user_id, role });
      }
      await adminClient.from("profiles").update({ role }).eq("user_id", user_id);

      await logAudit("change_role", user_id, targetEmail, { new_role: role, old_role: targetRole?.role });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── RESET PASSWORD ──
    if (action === "reset_password") {
      const { new_password } = body;
      if (!new_password || new_password.length < 6) {
        return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await adminClient.auth.admin.updateUserById(user_id, { password: new_password });
      if (error) throw error;

      await logAudit("reset_password", user_id, targetEmail, {});

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── DELETE USER ──
    if (action === "delete_user") {
      if (user_id === caller.id) {
        return new Response(JSON.stringify({ error: "Cannot delete your own account" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await adminClient.auth.admin.deleteUser(user_id);
      if (error) throw error;

      await logAudit("delete_user", user_id, targetEmail, {});

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("manage-user error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
