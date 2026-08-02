import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Not found", { status: 404 });

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const signature = req.headers.get("stripe-signature");
  if (!stripeKey || !webhookSecret || !signature) return new Response("Not found", { status: 404 });

  let eventId: string | null = null;
  let supabase: ReturnType<typeof createClient> | null = null;
  try {
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const event = await stripe.webhooks.constructEventAsync(await req.text(), signature, webhookSecret);
    eventId = event.id;
    supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { error: receiptError } = await supabase.from("payment_webhook_events").insert({
      provider_event_id: event.id,
      event_type: event.type,
      status: "processing",
    });
    if (receiptError?.code === "23505") {
      const { data: receipt } = await supabase.from("payment_webhook_events")
        .select("status")
        .eq("provider_event_id", event.id)
        .maybeSingle();
      if (receipt?.status !== "failed") return Response.json({ received: true, duplicate: true });
      const { error: retryError } = await supabase.from("payment_webhook_events")
        .update({ status: "processing", last_error: null })
        .eq("provider_event_id", event.id)
        .eq("status", "failed");
      if (retryError) throw retryError;
    } else if (receiptError) throw receiptError;

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid" && session.metadata?.kind === "booking" && session.metadata.target_id) {
        const bookingId = session.metadata.target_id;
        const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
        const total = session.amount_total ?? 0;
        const fee = Math.round(total * 0.15);
        const { data: booking, error } = await supabase.from("bookings").update({
          flow_status: "authorized",
          authorized_at: new Date().toISOString(),
          total_amount_cents: total,
          platform_fee_cents: fee,
          minder_payout_cents: total - fee,
          stripe_payment_intent_id: paymentIntentId,
        }).eq("id", bookingId).eq("flow_status", "accepted").select("parent_id").single();
        if (error) throw error;
        await supabase.from("booking_events").insert({
          booking_id: bookingId,
          actor_id: booking.parent_id,
          event_type: "payment_authorized",
          from_status: "accepted",
          to_status: "authorized",
          payload: { stripe_event_id: event.id },
        });
      }

      if (session.payment_status === "paid" && session.metadata?.kind === "training_course" && session.metadata.target_id && session.metadata.user_id) {
        const { error } = await supabase.from("training_bookings").insert({
          user_id: session.metadata.user_id,
          course_id: session.metadata.target_id,
          status: "confirmed",
          payment_status: "paid",
        });
        if (error) throw error;
      }
    }

    const { error: completionError } = await supabase.from("payment_webhook_events").update({
      status: "completed",
      processed_at: new Date().toISOString(),
      last_error: null,
    }).eq("provider_event_id", event.id);
    if (completionError) throw completionError;
    return Response.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error("stripe-webhook error", message);
    if (supabase && eventId) {
      await supabase.from("payment_webhook_events").update({
        status: "failed",
        last_error: message.slice(0, 1000),
      }).eq("provider_event_id", eventId);
    }
    return new Response("Webhook processing failed", { status: 500 });
  }
});
