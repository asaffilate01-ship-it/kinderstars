import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "npm:zod@3";

const allowedOrigins = new Set(
  (Deno.env.get("ALLOWED_ORIGINS") || "https://kinderstars.de,https://www.kinderstars.de")
    .split(",").map((value) => value.trim()).filter(Boolean),
);
const cors = (origin: string | null) => ({
  ...(origin && allowedOrigins.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});
const Payload = z.object({
  booking_id: z.string().uuid(),
  action: z.enum(["capture", "cancel", "refund"]),
  reason: z.string().trim().max(500).optional(),
});

serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = cors(origin);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: origin && allowedOrigins.has(origin) ? 204 : 403, headers });
  }
  if (req.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405, headers });

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return Response.json({ error: "unauthorized" }, { status: 401, headers });
  const parsed = Payload.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400, headers });

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const token = authHeader.slice("Bearer ".length);
  const { data: { user }, error: userError } = await admin.auth.getUser(token);
  if (userError || !user) return Response.json({ error: "unauthorized" }, { status: 401, headers });

  const { data: booking, error: bookingError } = await admin.from("bookings")
    .select("id,parent_id,childminder_id,flow_status,status,total_amount_cents,stripe_payment_intent_id")
    .eq("id", parsed.data.booking_id)
    .single();
  if (bookingError || !booking) return Response.json({ error: "booking_not_found" }, { status: 404, headers });

  const { data: role } = await admin.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
  const isAdmin = role?.role === "admin" || role?.role === "owner";
  const isParent = booking.parent_id === user.id;
  const isParticipant = isParent || booking.childminder_id === user.id;
  if (!isParticipant && !isAdmin) return Response.json({ error: "forbidden" }, { status: 403, headers });

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) return Response.json({ error: "payment_service_unavailable" }, { status: 503, headers });
  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const action = parsed.data.action;

  try {
    if (action === "capture") {
      if (!isParent && !isAdmin) return Response.json({ error: "forbidden" }, { status: 403, headers });
      if (booking.flow_status === "captured") return Response.json({ success: true, duplicate: true }, { headers });
      if (booking.flow_status !== "completed" || !booking.stripe_payment_intent_id) {
        return Response.json({ error: "booking_not_ready_for_capture" }, { status: 409, headers });
      }
      const intent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
      const amount = booking.total_amount_cents ?? 0;
      // Stripe may have completed a previous attempt while our database update failed.
      // Reconcile that safe retry instead of attempting a second capture.
      if (intent.status === "succeeded") {
        const now = new Date().toISOString();
        const { error } = await admin.from("bookings").update({
          flow_status: "captured", captured_at: now, status: "completed",
        }).eq("id", booking.id).eq("flow_status", "completed");
        if (error) throw error;
        await logEvent(admin, booking.id, user.id, "payment_capture_reconciled", "completed", "captured", { payment_intent_id: intent.id });
        return Response.json({ success: true, status: "captured", reconciled: true }, { headers });
      }
      if (intent.status !== "requires_capture" || amount < 50 || amount > intent.amount_capturable) {
        return Response.json({ error: "payment_not_capturable" }, { status: 409, headers });
      }
      const captured = await stripe.paymentIntents.capture(intent.id, { amount_to_capture: amount }, {
        idempotencyKey: `booking-capture:${booking.id}:${amount}`,
      });
      const now = new Date().toISOString();
      const { error } = await admin.from("bookings").update({
        flow_status: "captured", captured_at: now, status: "completed",
      }).eq("id", booking.id).eq("flow_status", "completed");
      if (error) throw error;
      await logEvent(admin, booking.id, user.id, "payment_captured", "completed", "captured", { payment_intent_id: captured.id, amount });
      return Response.json({ success: true, status: "captured" }, { headers });
    }

    if (action === "cancel") {
      if (["captured", "paid_out"].includes(booking.flow_status)) {
        return Response.json({ error: "captured_payment_requires_refund" }, { status: 409, headers });
      }
      if (booking.stripe_payment_intent_id) {
        const intent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
        if (["requires_capture", "requires_payment_method", "requires_confirmation", "requires_action", "processing"].includes(intent.status)) {
          await stripe.paymentIntents.cancel(intent.id, { cancellation_reason: "requested_by_customer" }, {
            idempotencyKey: `booking-cancel:${booking.id}`,
          });
        }
      }
      const { error } = await admin.from("bookings").update({
        flow_status: "cancelled", status: "cancelled", cancellation_reason: parsed.data.reason || "Cancelled by participant",
      }).eq("id", booking.id).not("flow_status", "in", "(captured,paid_out)");
      if (error) throw error;
      await logEvent(admin, booking.id, user.id, "payment_cancelled", booking.flow_status, "cancelled", {});
      return Response.json({ success: true, status: "cancelled" }, { headers });
    }

    if (!isAdmin) return Response.json({ error: "admin_required" }, { status: 403, headers });
    if (!["captured", "paid_out", "disputed"].includes(booking.flow_status) || !booking.stripe_payment_intent_id) {
      return Response.json({ error: "booking_not_refundable" }, { status: 409, headers });
    }
    const refund = await stripe.refunds.create({
      payment_intent: booking.stripe_payment_intent_id,
      reason: "requested_by_customer",
      metadata: { booking_id: booking.id, actor_id: user.id },
    }, { idempotencyKey: `booking-refund:${booking.id}` });
    const { error } = await admin.from("bookings").update({
      flow_status: "cancelled", status: "cancelled", cancellation_reason: parsed.data.reason || "Refunded by administrator",
    }).eq("id", booking.id);
    if (error) throw error;
    await logEvent(admin, booking.id, user.id, "payment_refunded", booking.flow_status, "cancelled", { refund_id: refund.id });
    return Response.json({ success: true, status: "refunded", refund_id: refund.id }, { headers });
  } catch (error) {
    console.error("manage-booking-payment failed", error instanceof Error ? error.message : "unknown");
    return Response.json({ error: "payment_operation_failed" }, { status: 500, headers });
  }
});

async function logEvent(
  client: ReturnType<typeof createClient>, bookingId: string, actorId: string,
  eventType: string, fromStatus: string, toStatus: string, payload: Record<string, unknown>,
) {
  await client.from("booking_events").insert({
    booking_id: bookingId, actor_id: actorId, event_type: eventType,
    from_status: fromStatus, to_status: toStatus, payload,
  });
}
