import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Configurable warning periods (days before expiry)
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const warningDays = body.warning_days ?? 30; // default 30 days
    const criticalDays = body.critical_days ?? 7; // default 7 days

    const today = new Date();
    const warningDate = new Date(today);
    warningDate.setDate(warningDate.getDate() + warningDays);
    const criticalDate = new Date(today);
    criticalDate.setDate(criticalDate.getDate() + criticalDays);

    // Fetch all childminder profiles with expiry dates
    const { data: cmProfiles, error: cmError } = await admin
      .from("childminder_profiles")
      .select("user_id, first_aid_expiry, insurance_expiry, dbs_issue_date, town, postcode_district");

    if (cmError) throw cmError;

    const alerts: Array<{
      user_id: string;
      type: string;
      field: string;
      expiry_date: string;
      days_remaining: number;
      severity: "warning" | "critical" | "expired";
    }> = [];

    for (const cm of cmProfiles ?? []) {
      const checks = [
        { field: "First Aid Certificate", date: cm.first_aid_expiry },
        { field: "Insurance", date: cm.insurance_expiry },
        // DBS: assume 3-year validity from issue date
        { field: "DBS Check", date: cm.dbs_issue_date ? new Date(new Date(cm.dbs_issue_date).setFullYear(new Date(cm.dbs_issue_date).getFullYear() + 3)).toISOString().split("T")[0] : null },
      ];

      for (const check of checks) {
        if (!check.date) continue;
        const expiryDate = new Date(check.date);
        const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysRemaining <= warningDays) {
          const severity = daysRemaining <= 0 ? "expired" : daysRemaining <= criticalDays ? "critical" : "warning";
          alerts.push({
            user_id: cm.user_id,
            type: "compliance_expiry",
            field: check.field,
            expiry_date: check.date,
            days_remaining: daysRemaining,
            severity,
          });
        }
      }
    }

    if (alerts.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No expiring items found", alerts: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get profile info for email sending
    const userIds = [...new Set(alerts.map(a => a.user_id))];
    const { data: profiles } = await admin
      .from("profiles")
      .select("user_id, email, first_name")
      .in("user_id", userIds);

    const profileMap: Record<string, { email: string; first_name: string }> = {};
    (profiles ?? []).forEach(p => { profileMap[p.user_id] = { email: p.email, first_name: p.first_name }; });

    // Group alerts by user
    const alertsByUser: Record<string, typeof alerts> = {};
    for (const alert of alerts) {
      if (!alertsByUser[alert.user_id]) alertsByUser[alert.user_id] = [];
      alertsByUser[alert.user_id].push(alert);
    }

    let notificationsSent = 0;
    let emailsSent = 0;

    for (const [userId, userAlerts] of Object.entries(alertsByUser)) {
      const profile = profileMap[userId];

      // Create in-app notifications for each alert
      for (const alert of userAlerts) {
        const severityEmoji = alert.severity === "expired" ? "🔴" : alert.severity === "critical" ? "🟠" : "🟡";
        const title = alert.severity === "expired"
          ? `${severityEmoji} ${alert.field} has EXPIRED`
          : `${severityEmoji} ${alert.field} expires in ${alert.days_remaining} day${alert.days_remaining !== 1 ? "s" : ""}`;

        await admin.from("notifications").insert({
          user_id: userId,
          title,
          body: `Your ${alert.field} ${alert.severity === "expired" ? "expired on" : "is due to expire on"} ${alert.expiry_date}. Please renew it as soon as possible to maintain compliance.`,
          type: "compliance_expiry",
        });
        notificationsSent++;
      }

      // Send consolidated email
      if (profile?.email) {
        const alertRows = userAlerts.map(a => {
          const color = a.severity === "expired" ? "#ef4444" : a.severity === "critical" ? "#f97316" : "#eab308";
          const label = a.severity === "expired" ? "EXPIRED" : a.severity === "critical" ? "CRITICAL" : "WARNING";
          return `<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>${a.field}</strong></td><td style="padding:8px;border-bottom:1px solid #eee">${a.expiry_date}</td><td style="padding:8px;border-bottom:1px solid #eee">${a.days_remaining} days</td><td style="padding:8px;border-bottom:1px solid #eee"><span style="background:${color};color:white;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:bold">${label}</span></td></tr>`;
        }).join("");

        const html = `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <h2 style="color:#333">⚠️ Compliance Expiry Alert</h2>
            <p>Hi ${profile.first_name || "there"},</p>
            <p>The following compliance items require your attention:</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <thead><tr style="background:#f5f5f5">
                <th style="padding:8px;text-align:left;font-size:12px">Item</th>
                <th style="padding:8px;text-align:left;font-size:12px">Expiry Date</th>
                <th style="padding:8px;text-align:left;font-size:12px">Days Left</th>
                <th style="padding:8px;text-align:left;font-size:12px">Status</th>
              </tr></thead>
              <tbody>${alertRows}</tbody>
            </table>
            <p>Please upload your renewed documents via the portal as soon as possible.</p>
            <p style="margin-top:20px;color:#888;font-size:12px">— KinderStars Compliance Team</p>
          </div>
        `;

        // Try to send via send-email function
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${serviceRoleKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: profile.email,
              subject: `⚠️ Compliance Alert: ${userAlerts.length} item${userAlerts.length > 1 ? "s" : ""} expiring soon`,
              html,
            }),
          });
          emailsSent++;
        } catch (emailErr) {
          console.error("Email send error:", emailErr);
        }
      }

      // Also notify admins
      const { data: adminRoles } = await admin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      for (const adminRole of adminRoles ?? []) {
        const name = profile?.first_name || userId.slice(0, 8);
        const expiredCount = userAlerts.filter(a => a.severity === "expired").length;
        const criticalCount = userAlerts.filter(a => a.severity === "critical").length;

        await admin.from("notifications").insert({
          user_id: adminRole.user_id,
          title: `📋 Compliance alert: ${name}`,
          body: `${userAlerts.length} item(s) expiring — ${expiredCount} expired, ${criticalCount} critical.`,
          type: "compliance_expiry",
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total_alerts: alerts.length,
      users_affected: Object.keys(alertsByUser).length,
      notifications_sent: notificationsSent,
      emails_sent: emailsSent,
      alerts,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("check-compliance-expiry error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
