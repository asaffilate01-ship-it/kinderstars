import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, redirectTo } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Generate recovery link
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: redirectTo || "https://kinderstars.lovable.app/reset-password",
      },
    });

    if (error) {
      // Don't reveal if user exists or not
      console.error("Generate link error:", error.message);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recoveryLink = data?.properties?.action_link;
    if (!recoveryLink) {
      console.error("No action_link returned");
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's name for personalisation
    const { data: profile } = await admin
      .from("profiles")
      .select("first_name")
      .eq("email", email)
      .maybeSingle();

    const firstName = profile?.first_name || "there";

    const emailHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFBF5; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #F97316, #FB923C); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Reset Your Password</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">KinderStars Account Security</p>
      </div>
      <div style="padding: 32px;">
        <p style="font-size: 16px;">Hi ${firstName},</p>
        <p>We received a request to reset the password for your KinderStars account. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${recoveryLink}" style="display: inline-block; background: #F97316; color: white; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">Reset Password →</a>
        </div>
        <p style="color: #666; font-size: 14px;">This link will expire in 24 hours. If you didn't request this, you can safely ignore this email.</p>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">If the button doesn't work, copy and paste this URL into your browser:<br/>
        <a href="${recoveryLink}" style="color: #F97316; word-break: break-all;">${recoveryLink}</a></p>
      </div>
      <div style="background: #F5F0EB; padding: 16px; text-align: center; font-size: 12px; color: #999;">
        KinderStars Ltd · Quality Childminding Agency<br/>info@kinderstars.co.uk
      </div>
    </div>`;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY || RESEND_API_KEY.length < 10) {
      console.log(`📧 PASSWORD RESET (simulated): To=${email}`);
      console.log(`   Recovery link: ${recoveryLink}`);
      return new Response(JSON.stringify({ success: true, simulated: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "KinderStars <info@kinderstars.co.uk>",
        to: [email],
        subject: "Reset your KinderStars password",
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      console.error("Resend error:", await res.text());
    } else {
      console.log(`✅ Password reset email sent via Resend to ${email}`);
    }

    // Always return success to prevent email enumeration
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-password-reset error:", err);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
