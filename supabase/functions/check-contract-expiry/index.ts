import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find active contracts expiring within 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: expiringContracts, error: fetchErr } = await supabase
      .from("contracts")
      .select("id, contract_type, parent_name, parent_email, expires_at, created_by")
      .eq("status", "active")
      .not("expires_at", "is", null)
      .lte("expires_at", thirtyDaysFromNow.toISOString().split("T")[0])
      .gte("expires_at", new Date().toISOString().split("T")[0]);

    if (fetchErr) throw fetchErr;

    console.log(`Found ${expiringContracts?.length || 0} contracts expiring within 30 days`);

    const notifications = [];
    const emailsSent: string[] = [];

    for (const contract of expiringContracts || []) {
      const daysLeft = Math.ceil(
        (new Date(contract.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      // Check if we already sent a notification for this contract recently (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", contract.created_by)
        .eq("type", "contract_expiry")
        .ilike("body", `%${contract.id}%`)
        .gte("created_at", sevenDaysAgo.toISOString())
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`Skipping notification for contract ${contract.id} - already notified recently`);
        continue;
      }

      const typeName = contract.contract_type?.replace(/_/g, " ") || "contract";
      const expiryDate = new Date(contract.expires_at).toLocaleDateString("en-GB");

      // Notify the contract creator
      notifications.push({
        user_id: contract.created_by,
        title: `Contract expiring in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
        body: `The ${typeName} contract for ${contract.parent_name || "unnamed party"} expires on ${expiryDate}. Contract ID: ${contract.id}`,
        type: "contract_expiry",
        link: "/portal/contracts",
      });

      // Send email reminder if we have an email address
      if (contract.parent_email) {
        try {
          const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-smtp-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              to: contract.parent_email,
              subject: `KinderStars Contract Renewal Reminder — ${daysLeft} days remaining`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: hsl(222, 95%, 13%); font-size: 20px;">Contract Renewal Reminder</h1>
                  <p>Dear ${contract.parent_name || "Valued Client"},</p>
                  <p>This is a friendly reminder that your <strong>${typeName}</strong> contract with KinderStars Ltd is due to expire on <strong>${expiryDate}</strong> — that's <strong>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong> from now.</p>
                  <p>To ensure continuity of your childcare arrangements, please contact us to discuss renewal options.</p>
                  <div style="margin: 24px 0; padding: 16px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid hsl(44, 93%, 40%);">
                    <p style="margin: 0; font-size: 14px;"><strong>Contract ID:</strong> ${contract.id.slice(0, 8)}…</p>
                    <p style="margin: 4px 0 0; font-size: 14px;"><strong>Type:</strong> ${typeName}</p>
                    <p style="margin: 4px 0 0; font-size: 14px;"><strong>Expires:</strong> ${expiryDate}</p>
                  </div>
                  <p>You can also review and sign renewal contracts directly through your <a href="https://kinderstars.lovable.app/portal/contracts" style="color: hsl(222, 95%, 40%);">KinderStars Portal</a>.</p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                  <p style="font-size: 12px; color: #999;">KinderStars Ltd • Victory House, Luton LU1 3BS • hello@kinderstars.co.uk</p>
                </div>
              `,
            }),
          });
          if (emailRes.ok) emailsSent.push(contract.parent_email);
        } catch (emailErr) {
          console.error(`Failed to send email to ${contract.parent_email}:`, emailErr);
        }
      }

      // Also notify admins
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      for (const admin of adminRoles || []) {
        if (admin.user_id === contract.created_by) continue;
        notifications.push({
          user_id: admin.user_id,
          title: `Contract expiring in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
          body: `The ${typeName} contract for ${contract.parent_name || "unnamed party"} expires on ${expiryDate}. Contract ID: ${contract.id}`,
          type: "contract_expiry",
          link: "/admin/dashboard",
        });
      }
    }

    if (notifications.length > 0) {
      const { error: insertErr } = await supabase.from("notifications").insert(notifications);
      if (insertErr) throw insertErr;
    }

    // Auto-expire contracts past their expiry date
    const { data: expired, error: expireErr } = await supabase
      .from("contracts")
      .update({ status: "expired" })
      .eq("status", "active")
      .not("expires_at", "is", null)
      .lt("expires_at", new Date().toISOString().split("T")[0])
      .select("id");

    if (expireErr) console.error("Auto-expire error:", expireErr);
    else if (expired?.length) console.log(`Auto-expired ${expired.length} contracts`);

    return new Response(
      JSON.stringify({
        expiring: expiringContracts?.length || 0,
        notificationsSent: notifications.length,
        emailsSent: emailsSent.length,
        autoExpired: expired?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Contract expiry check error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
