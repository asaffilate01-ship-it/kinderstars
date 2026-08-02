import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const allowedOrigins = new Set(
  (Deno.env.get("ALLOWED_ORIGINS") || "https://kinderstars.de,https://www.kinderstars.de")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

const corsHeaders = (origin: string | null) => ({
  ...(origin && allowedOrigins.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
  "Vary": "Origin",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
});

// KinderStars DE — inline EUR price catalogue.
// Amounts in cents. Stripe products/prices are created on-the-fly via
// `price_data`, so no hardcoded price IDs are required. The user can enable
// Lovable-managed Stripe at any time and this checkout will work immediately.
type PriceDef = {
  name: string;
  amountCents: number;
  currency: "eur";
  interval?: "month" | "year"; // omitted = one-off
};
const CATALOGUE: Record<string, PriceDef> = {
  compliance_plus_monthly:         { name: "KinderStars Compliance Plus (Monat)",           amountCents: 1499,  currency: "eur", interval: "month" },
  compliance_plus_annual:          { name: "KinderStars Compliance Plus (Jahr)",            amountCents: 14900, currency: "eur", interval: "year"  },
  professional_compliance_monthly: { name: "KinderStars Professional Compliance (Monat)",   amountCents: 2999,  currency: "eur", interval: "month" },
  professional_compliance_annual:  { name: "KinderStars Professional Compliance (Jahr)",    amountCents: 29900, currency: "eur", interval: "year"  },
  jugendamt_ready_monitor_basic:   { name: "Jugendamt Ready Monitoring Basic",              amountCents: 1999,  currency: "eur", interval: "month" },
  jugendamt_ready_monitor_pro:     { name: "Jugendamt Ready Monitoring Pro",                amountCents: 2999,  currency: "eur", interval: "month" },
  verification_fee:                { name: "KinderStars Verified (12 Monate)",              amountCents: 7900,  currency: "eur" },
  jugendamt_ready_assessment:      { name: "Jugendamt Ready Assessment",                    amountCents: 14900, currency: "eur" },
  first_aid_seat:                  { name: "Erste Hilfe am Kind — Platz",                   amountCents: 6900,  currency: "eur" },
  dbs_standard:                    { name: "Einfaches Führungszeugnis",                     amountCents: 1300,  currency: "eur" },
  dbs_enhanced:                    { name: "Erweitertes Führungszeugnis (§ 30a BZRG)",       amountCents: 1300,  currency: "eur" },
  bpss:                            { name: "Zuverlässigkeitsprüfung Premium",               amountCents: 4900,  currency: "eur" },
};

type PriceKey = keyof typeof CATALOGUE;

serve(async (req) => {
  const requestOrigin = req.headers.get("origin");
  const responseCorsHeaders = corsHeaders(requestOrigin);
  if (req.method === "OPTIONS") {
    if (!requestOrigin || !allowedOrigins.has(requestOrigin)) return new Response(null, { status: 403 });
    return new Response(null, { headers: responseCorsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user?.email) throw new Error("User not authenticated");
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );

    const body = await req.json() as {
      price_key?: PriceKey;
      course_id?: string;
      booking_id?: string;
      quantity?: number;
    };
    const price_key = body.price_key;
    const qty = Math.max(1, Math.min(50, body.quantity ?? 1));
    let lineItem: Stripe.Checkout.SessionCreateParams.LineItem;
    let isRecurring = false;
    let checkoutKind = "catalogue";
    let targetId = "";
    let captureManually = false;
    if (price_key) {
      const def = CATALOGUE[price_key];
      if (!def) throw new Error(`Unknown price_key: ${price_key}`);
      isRecurring = !!def.interval;
      lineItem = {
        quantity: qty,
        price_data: {
          currency: def.currency,
          unit_amount: def.amountCents,
          product_data: { name: def.name, metadata: { price_key } },
          ...(def.interval ? { recurring: { interval: def.interval } } : {}),
        },
      };
    } else if (body.course_id) {
      const { data: course, error } = await userClient
        .from("training_courses")
        .select("id,title,price_pence,stripe_price_id,is_active")
        .eq("id", body.course_id)
        .eq("is_active", true)
        .single();
      if (error || !course?.stripe_price_id || course.price_pence <= 0) throw new Error("Paid course is unavailable");
      lineItem = { price: course.stripe_price_id, quantity: 1 };
      checkoutKind = "training_course";
      targetId = course.id;
    } else if (body.booking_id) {
      const { data: booking, error } = await userClient
        .from("bookings")
        .select("id,parent_id,start_time,end_time,hourly_rate_cents,flow_status")
        .eq("id", body.booking_id)
        .eq("parent_id", user.id)
        .eq("flow_status", "accepted")
        .single();
      if (error || !booking?.hourly_rate_cents) throw new Error("Accepted booking is unavailable");
      const [startHour, startMinute] = booking.start_time.split(":").map(Number);
      const [endHour, endMinute] = booking.end_time.split(":").map(Number);
      const minutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
      const total = Math.round((minutes / 60) * booking.hourly_rate_cents);
      if (minutes <= 0 || total < 50) throw new Error("Booking total is invalid");
      lineItem = {
        quantity: 1,
        price_data: { currency: "eur", unit_amount: total, product_data: { name: "KinderStars booking" } },
      };
      checkoutKind = "booking";
      targetId = booking.id;
      captureManually = true;
    } else {
      throw new Error("Provide a supported price_key, course_id, or booking_id");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    // Find or note existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;
    const origin = requestOrigin && allowedOrigins.has(requestOrigin) ? requestOrigin : "https://kinderstars.de";
    const minuteWindow = Math.floor(Date.now() / 60_000);
    const idempotencyKey = `checkout:${user.id}:${price_key || targetId}:${qty}:${minuteWindow}`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [lineItem],
      mode: isRecurring ? "subscription" : "payment",
      locale: "de",
      success_url: `${origin}/childminder/subscription?success=true`,
      cancel_url: `${origin}/childminder/subscription?canceled=true`,
      metadata: { user_id: user.id, price_key: price_key ?? "", kind: checkoutKind, target_id: targetId },
      ...(isRecurring ? { subscription_data: { metadata: { user_id: user.id, price_key: price_key ?? "" } } } : {}),
      ...(captureManually ? { payment_intent_data: { capture_method: "manual", metadata: { booking_id: targetId } } } : {}),
    }, { idempotencyKey });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...responseCorsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...responseCorsHeaders, "Content-Type": "application/json" },
      status: msg.includes("authenticated") || msg.includes("authorization") ? 401 : 400,
    });
  }
});
