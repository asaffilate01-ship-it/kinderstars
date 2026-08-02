import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "https://kinderstars.de,https://www.kinderstars.de")
  .split(",").map((origin) => origin.trim()).filter(Boolean);

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  const headers = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    "Vary": "Origin",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers });

    const url = Deno.env.get("SUPABASE_URL")!;
    const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user?.email) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers });

    const body = await req.json();
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    if (!/^KS-[A-Z0-9]{6}$/.test(code)) {
      return new Response(JSON.stringify({ error: "Invalid referral code" }), { status: 400, headers });
    }

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: owner } = await admin.from("referral_codes").select("user_id").eq("code", code).maybeSingle();
    if (!owner || owner.user_id === user.id) {
      return new Response(JSON.stringify({ error: "Referral code cannot be claimed" }), { status: 400, headers });
    }

    const { data: existing } = await admin.from("referrals")
      .select("id, referrer_user_id")
      .or(`referred_user_id.eq.${user.id},referred_email.eq.${user.email.toLowerCase()}`)
      .limit(1).maybeSingle();

    if (existing) {
      if (existing.referrer_user_id !== owner.user_id) {
        return new Response(JSON.stringify({ error: "A different referral is already recorded" }), { status: 409, headers });
      }
      await admin.from("referrals").update({ referred_user_id: user.id }).eq("id", existing.id);
      return new Response(JSON.stringify({ success: true, existing: true }), { headers });
    }

    const { error } = await admin.from("referrals").insert({
      referrer_user_id: owner.user_id,
      referred_user_id: user.id,
      referred_email: user.email.toLowerCase(),
      code,
      trigger_event: "signup",
      bounty_cents: 0,
      status: "pending",
    });
    if (error) throw error;
    return new Response(JSON.stringify({ success: true, existing: false }), { headers });
  } catch (error) {
    console.error("claim-referral error", error);
    return new Response(JSON.stringify({ error: "Unable to claim referral" }), { status: 500, headers });
  }
});
