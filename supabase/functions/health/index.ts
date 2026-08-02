import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

serve(async (req) => {
  if (req.method !== "GET") return new Response("Not found", { status: 404 });
  const expectedToken = Deno.env.get("HEALTH_CHECK_TOKEN") ?? "";
  if (!expectedToken || !safeEqual(req.headers.get("x-health-token") ?? "", expectedToken)) {
    return new Response("Not found", { status: 404 });
  }

  const configured = {
    stripe: Boolean(Deno.env.get("STRIPE_SECRET_KEY") && Deno.env.get("STRIPE_WEBHOOK_SECRET")),
    amiqus: Boolean(Deno.env.get("AMIQUS_WEBHOOK_SECRET")),
    email: Boolean(Deno.env.get("RESEND_API_KEY")),
    origins: Boolean(Deno.env.get("ALLOWED_ORIGINS")),
  };
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
  const { error } = await supabase.from("payment_webhook_events").select("id", { head: true, count: "exact" }).limit(1);
  const checks = { database: !error, ...configured };
  const ready = Object.values(checks).every(Boolean);

  return Response.json(
    { status: ready ? "ready" : "degraded", checks, checked_at: new Date().toISOString() },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
});

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

