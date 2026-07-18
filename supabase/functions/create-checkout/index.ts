import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// KinderStars price mapping
const PRICES = {
  basic_monthly:          "price_1T8rvyFFogsDQVs4CE1cn0Pz",  // £4.99/mo
  basic_annual:           "price_1T8rw6FFogsDQVs4aIIMtR2n",  // £49.90/yr
  training_monthly:       "price_1T8rwBFFogsDQVs4q39R4nqm",  // £19.99/mo
  training_annual:        "price_1T8rwCFFogsDQVs4F0WvS9oV",  // £199.00/yr
  dbs_standard:           "price_1T8rwFFFogsDQVs49fEa38CA",  // £38.00 one-off
  dbs_enhanced:           "price_1T8rwIFFogsDQVs41Bot1jm5",  // £45.00 one-off
  bpss:                   "price_1T8rwHFFogsDQVs4JqLKNkWH",  // £220.00 one-off
} as const;

type PriceKey = keyof typeof PRICES;

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

    const body = await req.json() as { price_key?: PriceKey; price_id?: string; mode?: string };
    // Support both price_key (named key) and direct price_id
    const priceId = body.price_key ? PRICES[body.price_key] : body.price_id;
    if (!priceId) throw new Error(`Invalid price: ${JSON.stringify(body)}`);
    const isRecurringOverride = body.mode === "payment" ? false : undefined;
    const price_key = body.price_key;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    // Find or note existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    const isRecurring = isRecurringOverride !== undefined ? false :
      ["basic_monthly", "basic_annual", "training_monthly", "training_annual"].includes(price_key ?? "");
    const origin = req.headers.get("origin") || "https://kinderstars.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: isRecurring ? "subscription" : "payment",
      success_url: `${origin}/childminder/subscription?success=true`,
      cancel_url: `${origin}/childminder/subscription?canceled=true`,
      metadata: { user_id: user.id, price_key },
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
