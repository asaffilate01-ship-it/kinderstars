import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
};

type PriceKey = keyof typeof CATALOGUE;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    const body = await req.json() as {
      price_key?: PriceKey;
      price_id?: string;
      mode?: string;
      quantity?: number;
    };
    const price_key = body.price_key;
    const qty = Math.max(1, Math.min(50, body.quantity ?? 1));
    let lineItem: Stripe.Checkout.SessionCreateParams.LineItem;
    let isRecurring = false;
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
    } else if (body.price_id) {
      lineItem = { price: body.price_id, quantity: qty };
      isRecurring = body.mode !== "payment";
    } else {
      throw new Error("Provide price_key or price_id");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    // Find or note existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;
    if (body.mode === "payment") isRecurring = false;
    const origin = req.headers.get("origin") || "https://kinderstars.de";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [lineItem],
      mode: isRecurring ? "subscription" : "payment",
      locale: "de",
      success_url: `${origin}/childminder/subscription?success=true`,
      cancel_url: `${origin}/childminder/subscription?canceled=true`,
      metadata: { user_id: user.id, price_key: price_key ?? "" },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
