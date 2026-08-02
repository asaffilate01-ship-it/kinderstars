import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const webhookSecret = Deno.env.get("AMIQUS_WEBHOOK_SECRET");
    const signature = req.headers.get("x-aqid-signature");
    const rawBody = await req.text();
    if (!webhookSecret || !signature || !(await verifySignature(rawBody, webhookSecret, signature))) {
      return new Response("Not found", { status: 404 });
    }

    const payload = JSON.parse(rawBody);
    console.log("Amiqus webhook received:", JSON.stringify(payload).slice(0, 500));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Amiqus sends events like: record.completed, record.updated, step.completed, etc.
    const eventType = payload.trigger?.alias || payload.event || payload.type || "";
    const recordData = payload.data?.record || payload.record || payload.data || {};
    const recordId = recordData.id || payload.record_id || "";
    const clientEmail = recordData.client?.email || payload.client?.email || "";
    const status = recordData.status || payload.status || "";

    if (!recordId) {
      console.log("No record ID in webhook payload, skipping");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the compliance document that references this Amiqus record ID
    const { data: docs } = await supabase
      .from("compliance_documents")
      .select("*")
      .like("review_notes", `%${recordId}%`);

    if (!docs || docs.length === 0) {
      console.log(`No compliance document found for Amiqus record: ${recordId}`);
      return new Response(JSON.stringify({ received: true, matched: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const doc = docs[0];

    // Map Amiqus statuses to our compliance status
    let newStatus = doc.status;
    let notificationTitle = "";
    let notificationBody = "";

    if (eventType.includes("completed") || status === "complete" || status === "completed") {
      // Check if the result indicates a clear/pass
      const result = recordData.result || payload.result || "";
      if (result === "consider" || result === "rejected" || result === "failed") {
        newStatus = "rejected";
        notificationTitle = "Verification check requires review";
        notificationBody = "Your background check has flagged items that require manual review by the KinderStars team.";
      } else {
        newStatus = "approved";
        notificationTitle = "Verification check completed ✅";
        notificationBody = "Your background check has been completed and approved automatically.";
      }
    } else if (eventType.includes("in_progress") || status === "in_progress" || status === "processing") {
      newStatus = "in_review";
      notificationTitle = "Verification check in progress";
      notificationBody = "Your background check is being processed by Amiqus.";
    } else if (eventType.includes("withdrawn") || status === "withdrawn" || status === "cancelled") {
      newStatus = "rejected";
      notificationTitle = "Verification check withdrawn";
      notificationBody = "Your background check was withdrawn. Please contact KinderStars if you need to restart.";
    }

    // Update compliance document status
    if (newStatus !== doc.status) {
      await supabase
        .from("compliance_documents")
        .update({
          status: newStatus,
          review_notes: `${doc.review_notes || ""}\n[${new Date().toISOString()}] Amiqus webhook: ${eventType} → ${newStatus}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", doc.id);

      // Send notification to the user
      if (notificationTitle && doc.user_id) {
        await supabase.from("notifications").insert({
          user_id: doc.user_id,
          title: notificationTitle,
          body: notificationBody,
          type: newStatus === "approved" ? "success" : newStatus === "rejected" ? "warning" : "info",
          link: "/childminder/onboarding",
        });

        // If DBS check approved, auto-update childminder profile DBS fields
        if (newStatus === "approved" && doc.document_type === "dbs_certificate") {
          const steps = recordData.steps || [];
          const dbsStep = steps.find((s: any) => s.type === "criminal_record_check");
          if (dbsStep?.certificate_number) {
            await supabase
              .from("childminder_profiles")
              .update({
                dbs_number: dbsStep.certificate_number,
                dbs_issue_date: new Date().toISOString().split("T")[0],
              })
              .eq("user_id", doc.user_id);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true, updated: newStatus !== doc.status, new_status: newStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("amiqus-webhook error:", e);
    return new Response(JSON.stringify({ received: false, error: "Webhook processing failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function verifySignature(payload: string, secret: string, signature: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
    const received = Uint8Array.from(atob(signature), (character) => character.charCodeAt(0));
    if (expected.length !== received.length) return false;
    let mismatch = 0;
    for (let index = 0; index < expected.length; index += 1) mismatch |= expected[index] ^ received[index];
    return mismatch === 0;
  } catch {
    return false;
  }
}
