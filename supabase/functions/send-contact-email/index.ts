import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const enquiryLabels: Record<string, string> = {
  parent: "Parent looking for childcare",
  childminder: "Registered Childminder",
  "become-childminder": "Wants to become a Childminder",
  general: "General enquiry",
};

// Simple in-memory rate limiter (resets on cold start, but sufficient for basic protection)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max requests per window
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting by IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               req.headers.get("cf-connecting-ip") || 
               "unknown";
    if (isRateLimited(ip)) {
      return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name, email, message, enquiryType } = await req.json();

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (name.length > 100 || email.length > 255 || message.length > 2000) {
      return new Response(JSON.stringify({ error: "Input too long" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || /[\r\n]/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (/[\r\n]/.test(name)) {
      return new Response(JSON.stringify({ error: "Invalid name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validEnquiryTypes = ["parent", "childminder", "become-childminder", "general"];
    if (enquiryType && !validEnquiryTypes.includes(enquiryType)) {
      return new Response(JSON.stringify({ error: "Invalid enquiry type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const escapeHtml = (str: string) =>
      str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    const typeLabel = enquiryLabels[enquiryType] || "Not specified";
    const subjectPrefix = enquiryType === "become-childminder" ? "🌟 Prospect Childminder" : "Website Enquiry";

    const emailHtml = `<h2>New ${subjectPrefix}</h2>
      <p><strong>Enquiry Type:</strong> ${escapeHtml(typeLabel)}</p>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY || RESEND_API_KEY.length < 10) {
      console.log(`📧 EMAIL (simulated): From=${email}, Subject=${subjectPrefix} from ${name}`);
      return new Response(JSON.stringify({ success: true, simulated: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "KinderStars Website <info@kinderstars.co.uk>",
        to: ["info@kinderstars.co.uk"],
        subject: `${subjectPrefix} from ${escapeHtml(name)}`,
        html: emailHtml,
        reply_to: email,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Resend error:", errBody);
      throw new Error("Failed to send email");
    }

    console.log(`✅ Contact email sent via Resend from ${email}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Contact email error:", error);
    return new Response(JSON.stringify({ error: "Failed to send" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
