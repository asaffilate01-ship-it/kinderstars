import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { shifts, childminders, availability } = await req.json();

    // Build a prompt with all the data for the AI to analyze
    const prompt = `You are a childminder shift scheduling AI for KinderStars agency.

Given the following unassigned shifts and available childminders, create optimal assignments.

UNASSIGNED SHIFTS:
${JSON.stringify(shifts, null, 2)}

AVAILABLE CHILDMINDERS (with location, availability, preferences):
${JSON.stringify(childminders, null, 2)}

EXISTING AVAILABILITY RECORDS:
${JSON.stringify(availability, null, 2)}

Rules:
1. Match childminder location (postcode_district) as close as possible to shift location
2. Don't double-book a childminder for overlapping times
3. Prefer childminders who are marked is_available=true and is_live=true
4. Consider experience_years as a quality factor
5. Distribute shifts fairly across childminders

Return your response using the assign_shifts tool.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a scheduling optimization AI. Always use the provided tool to return structured results." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "assign_shifts",
              description: "Return optimal shift assignments",
              parameters: {
                type: "object",
                properties: {
                  assignments: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        shift_id: { type: "string", description: "The shift ID to assign" },
                        childminder_id: { type: "string", description: "The childminder user_id to assign" },
                        reason: { type: "string", description: "Why this assignment was chosen" },
                        confidence: { type: "number", description: "Confidence score 0-100" },
                      },
                      required: ["shift_id", "childminder_id", "reason", "confidence"],
                      additionalProperties: false,
                    },
                  },
                  unassignable: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        shift_id: { type: "string" },
                        reason: { type: "string" },
                      },
                      required: ["shift_id", "reason"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string", description: "Brief summary of the scheduling decisions" },
                },
                required: ["assignments", "unassignable", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "assign_shifts" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("AI did not return structured assignments");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-scheduler error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
