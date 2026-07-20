import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AMIQUS_API_URL = "https://id.amiqus.co/api/v2";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const AMIQUS_API_KEY = Deno.env.get("AMIQUS_API_KEY");
    if (!AMIQUS_API_KEY) {
      return new Response(JSON.stringify({ error: "Amiqus API key not configured. Please add your AMIQUS_API_KEY." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    const { check_type, first_name, last_name, email } = await req.json();

    if (!check_type || !first_name || !last_name || !email) {
      return new Response(JSON.stringify({ error: "Missing required fields: check_type, first_name, last_name, email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Create a client (applicant) in Amiqus
    const clientRes = await fetch(`${AMIQUS_API_URL}/clients`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AMIQUS_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: { title: null, first_name, last_name },
        email,
      }),
    });

    if (!clientRes.ok) {
      const errBody = await clientRes.text();
      console.error("Amiqus create client error:", clientRes.status, errBody);
      throw new Error(`Failed to create Amiqus client [${clientRes.status}]: ${errBody}`);
    }

    const client = await clientRes.json();
    const clientId = client.data?.id || client.id;

    // Step 2: Create a record (check request) for the client
    // Map check_type to Amiqus step types
    const steps = [];
    
    if (check_type === "dbs" || check_type === "full") {
      steps.push({ type: "criminal_record_check", variant: "enhanced" });
    }
    if (check_type === "identity" || check_type === "full") {
      steps.push({ type: "identity_report" });
    }
    if (check_type === "right_to_work" || check_type === "full") {
      steps.push({ type: "right_to_work" });
    }

    const recordRes = await fetch(`${AMIQUS_API_URL}/records`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AMIQUS_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        steps,
      }),
    });

    if (!recordRes.ok) {
      const errBody = await recordRes.text();
      console.error("Amiqus create record error:", recordRes.status, errBody);
      throw new Error(`Failed to create Amiqus record [${recordRes.status}]: ${errBody}`);
    }

    const record = await recordRes.json();
    const recordId = record.data?.id || record.id;

    // Step 3: Store a compliance document entry tracking this check
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const docTypeMap: Record<string, string> = {
      dbs: "dbs_certificate",
      identity: "identity_verification",
      right_to_work: "right_to_work",
      full: "full_amiqus_check",
    };

    await adminClient.from("compliance_documents").insert({
      user_id: userId,
      document_type: docTypeMap[check_type] || check_type,
      status: "pending",
      review_notes: `Amiqus record ID: ${recordId}, client ID: ${clientId}`,
    });

    // Step 4: Create a notification for the user
    const checkLabelDE = check_type === "dbs"
      ? "Führungszeugnis-Prüfung (§ 30a BZRG)"
      : check_type === "identity"
      ? "Identitätsprüfung"
      : check_type === "right_to_work"
      ? "Prüfung der Arbeitserlaubnis"
      : "Hintergrundprüfung";
    await adminClient.from("notifications").insert({
      user_id: userId,
      title: "Verifizierungsprüfung gestartet",
      body: `Ihre ${checkLabelDE} wurde gestartet. Sie erhalten in Kürze eine E-Mail von Amiqus mit den nächsten Schritten.`,
      type: "info",
      link: "/childminder/onboarding",
    });

    return new Response(JSON.stringify({
      success: true,
      record_id: recordId,
      client_id: clientId,
      message: "Prüfung gestartet — die Bewerberin/der Bewerber erhält eine E-Mail von Amiqus, um den Vorgang abzuschließen.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("amiqus-create-check error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
