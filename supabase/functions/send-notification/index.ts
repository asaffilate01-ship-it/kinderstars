import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Authenticate the caller
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const isServiceCall = token === serviceRoleKey;

  let callerId: string | null = null;

  if (!isServiceCall) {
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    callerId = userData.user.id;
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body = await req.json();
    const { type } = body;

    let notification: { user_id: string; title: string; body: string; type: string } | null = null;

    switch (type) {
      case "booking_request": {
        // Validate: caller must be the parent of the booking
        if (!isServiceCall && callerId) {
          const { data: booking } = await admin
            .from("bookings")
            .select("parent_id, childminder_id")
            .eq("parent_id", callerId)
            .eq("childminder_id", body.booking_childminder_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!booking) {
            return new Response(JSON.stringify({ error: "Unauthorized: no matching booking found" }), {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
        notification = {
          user_id: body.booking_childminder_id,
          title: "New Booking Request",
          body: `A parent has requested a booking. Please review and respond.`,
          type: "booking",
        };
        break;
      }
      case "booking_accepted":
      case "booking_declined": {
        // Validate: caller must be the childminder of the booking
        if (!isServiceCall && callerId) {
          const { data: booking } = await admin
            .from("bookings")
            .select("parent_id, childminder_id")
            .eq("childminder_id", callerId)
            .eq("parent_id", body.booking_parent_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!booking) {
            return new Response(JSON.stringify({ error: "Unauthorized: no matching booking found" }), {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
        notification = {
          user_id: body.booking_parent_id,
          title: type === "booking_accepted" ? "Booking Accepted ✅" : "Booking Declined",
          body: type === "booking_accepted"
            ? `Your booking has been accepted by the childminder.`
            : `Your booking request was declined. Please try another childminder.`,
          type: "booking",
        };
        break;
      }
      case "shift_offer": {
        // Only admins or service calls can send shift offers
        if (!isServiceCall) {
          const { data: roleData } = await admin
            .from("user_roles")
            .select("role")
            .eq("user_id", callerId!)
            .eq("role", "admin")
            .maybeSingle();
          if (!roleData) {
            return new Response(JSON.stringify({ error: "Forbidden: admin access required" }), {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
        notification = {
          user_id: body.childminder_id,
          title: "New Shift Offer 🕐",
          body: `You have a new shift offer. Check your shifts page for details.`,
          type: "shift_offer",
        };
        break;
      }
      case "timesheet_approved":
      case "timesheet_rejected": {
        // Only admins or service calls can approve/reject timesheets
        if (!isServiceCall) {
          const { data: roleData } = await admin
            .from("user_roles")
            .select("role")
            .eq("user_id", callerId!)
            .eq("role", "admin")
            .maybeSingle();
          if (!roleData) {
            return new Response(JSON.stringify({ error: "Forbidden: admin access required" }), {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
        notification = {
          user_id: body.childminder_id,
          title: type === "timesheet_approved" ? "Timesheet Approved ✅" : "Timesheet Rejected ❌",
          body: type === "timesheet_approved"
            ? `Your timesheet has been approved.`
            : `Your timesheet was rejected. Please review and resubmit.`,
          type: type,
        };
        break;
      }
      case "direct": {
        // Admin-only direct notification to any user
        if (!isServiceCall) {
          const { data: roleData } = await admin
            .from("user_roles")
            .select("role")
            .eq("user_id", callerId!)
            .maybeSingle();
          if (!roleData || (roleData.role !== "admin" && roleData.role !== "owner")) {
            return new Response(JSON.stringify({ error: "Forbidden: admin access required" }), {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
        if (!body.user_id || !body.title) {
          return new Response(JSON.stringify({ error: "user_id and title are required for direct notifications" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        notification = {
          user_id: body.user_id,
          title: body.title,
          body: body.body || "",
          type: body.notification_type || "info",
        };
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "Unknown notification type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (notification) {
      const { error: notifError } = await admin.from("notifications").insert({
        user_id: notification.user_id,
        title: notification.title,
        body: notification.body,
        type: notification.type,
      });

      if (notifError) {
        console.error("Notification insert error:", notifError);
      }

      const { data: profile } = await admin.from("profiles")
        .select("email, first_name")
        .eq("user_id", notification.user_id)
        .maybeSingle();

      if (profile?.email) {
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        if (RESEND_API_KEY && RESEND_API_KEY.length >= 10) {
          const emailHtml = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFBF5; border-radius: 16px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #F97316, #FB923C); padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 22px;">KinderStars Notification</h1>
              </div>
              <div style="padding: 24px;">
                <p style="font-size: 16px;">Hi ${profile.first_name || "there"},</p>
                <h2 style="color: #F97316; margin: 16px 0 8px;">${notification.title}</h2>
                <p>${notification.body}</p>
                <div style="text-align: center; margin-top: 24px;">
                  <a href="https://kinderstars.lovable.app/portal" style="display: inline-block; background: #F97316; color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: bold;">View in Portal →</a>
                </div>
              </div>
              <div style="background: #F5F0EB; padding: 16px; text-align: center; font-size: 12px; color: #999;">
                KinderStars Ltd · Quality Childminding Agency<br/>info@kinderstars.co.uk
              </div>
            </div>`;

          try {
            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
              body: JSON.stringify({
                from: "KinderStars <info@kinderstars.co.uk>",
                to: [profile.email],
                subject: notification.title,
                html: emailHtml,
              }),
            });
            if (!res.ok) {
              console.error("Resend notification email error:", await res.text());
            } else {
              console.log(`✅ Notification email sent via Resend to ${profile.email}`);
            }
          } catch (emailErr) {
            console.error("Failed to send notification email:", emailErr);
          }
        } else {
          console.log(`📧 EMAIL (simulated - no Resend key): To=${profile.email}, Subject=${notification.title}`);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
