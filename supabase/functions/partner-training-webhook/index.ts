// Public webhook for training-provider integrations (DRK, Malteser, VHS, etc.).
// Providers POST enrolment or completion events; we mirror them into
// partner_training_enrollments and, on completion, into cpd_records.
//
// Auth: shared secret via `x-partner-secret` header, matched against
// PARTNER_TRAINING_WEBHOOK_SECRET. Configure verify_jwt = false via config.toml.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const PayloadSchema = z.object({
  provider: z.string().min(1).max(80),
  external_ref: z.string().min(1).max(200),
  user_email: z.string().email().max(255),
  course_slug: z.string().min(1).max(120).optional(),
  event: z.enum(["enrolled", "in_progress", "completed", "cancelled"]),
  cpd_hours: z.number().min(0).max(200).optional(),
  certificate_url: z.string().url().max(1024).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const secret = Deno.env.get("PARTNER_TRAINING_WEBHOOK_SECRET");
  const provided = req.headers.get("x-partner-secret");
  if (!secret || provided !== secret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try { body = await req.json(); } catch { body = null; }
  const parsed = PayloadSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const p = parsed.data;

  // Match user by email
  const { data: prof } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("email", p.user_email.toLowerCase())
    .maybeSingle();
  if (!prof) {
    return new Response(JSON.stringify({ error: "user_not_found", email: p.user_email }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Match course by slug (optional)
  let partner_course_id: string | null = null;
  if (p.course_slug) {
    const { data: course } = await supabase
      .from("partner_courses")
      .select("id")
      .eq("slug", p.course_slug)
      .maybeSingle();
    partner_course_id = course?.id ?? null;
  }

  const now = new Date().toISOString();
  const upsertPayload: Record<string, unknown> = {
    user_id: prof.user_id,
    partner_course_id,
    provider: p.provider,
    external_ref: p.external_ref,
    status: p.event,
    cpd_hours: p.cpd_hours ?? null,
    certificate_url: p.certificate_url ?? null,
  };
  if (p.event === "completed") upsertPayload.completed_at = now;

  const { error: upsertErr } = await supabase
    .from("partner_training_enrollments")
    .upsert(upsertPayload, { onConflict: "provider,external_ref" });

  if (upsertErr) {
    return new Response(JSON.stringify({ error: upsertErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // On completion, also record CPD hours if any
  if (p.event === "completed" && p.cpd_hours && p.cpd_hours > 0) {
    await supabase.from("cpd_records").insert({
      user_id: prof.user_id,
      title: `${p.provider} — ${p.course_slug ?? p.external_ref}`,
      provider: p.provider,
      hours: p.cpd_hours,
      completed_at: now,
      certificate_url: p.certificate_url ?? null,
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});