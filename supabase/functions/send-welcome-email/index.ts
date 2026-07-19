import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PARENT_SUBJECT = "Welcome to KinderStars! 🌟 Your Parent Account is Ready";
const CHILDMINDER_SUBJECT = "Welcome to KinderStars! 🌟 Getting Started as a Childminder";

const parentHtml = (firstName: string) => `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFBF5; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #F97316, #FB923C); padding: 32px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to KinderStars! 🌟</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Quality childcare, simplified.</p>
  </div>
  <div style="padding: 32px;">
    <p style="font-size: 16px;">Hi ${firstName || "there"},</p>
    <p>Thank you for joining KinderStars! Here's how to get started:</p>
    <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #F97316;">📋 Your Next Steps</h3>
      <ol style="line-height: 2;">
        <li><strong>Complete your profile</strong> — Add your address, preferences, and contact details</li>
        <li><strong>Register your children</strong> — Add each child's details, allergies, and special needs</li>
        <li><strong>Set up funding</strong> — If eligible for 15/30 funded hours, provide your eligibility code to KinderStars</li>
        <li><strong>Find a childminder</strong> — Browse our vetted network and request bookings</li>
        <li><strong>Manage bookings</strong> — Track sessions, view invoices, and communicate with your childminder</li>
      </ol>
    </div>
    <p style="color: #666; font-size: 14px;">Need help? Reply to this email or contact us at <a href="mailto:hello@kinderstars.de" style="color: #F97316;">hello@kinderstars.de</a></p>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://kinderstars.de/parent" style="display: inline-block; background: #F97316; color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: bold;">Go to Your Dashboard →</a>
    </div>
  </div>
  <div style="background: #F5F0EB; padding: 16px; text-align: center; font-size: 12px; color: #999;">
    KinderStars GmbH · Quality Childminding Agency<br/>hello@kinderstars.de
  </div>
</div>`;

const childminderHtml = (firstName: string) => `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFBF5; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #059669, #34D399); padding: 32px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to KinderStars! 🌟</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Join our professional childminding network.</p>
  </div>
  <div style="padding: 32px;">
    <p style="font-size: 16px;">Hi ${firstName || "there"},</p>
    <p>Welcome aboard! Here's your onboarding checklist to get verified and start receiving shifts:</p>
    <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #059669;">📋 Onboarding Checklist</h3>
      <ol style="line-height: 2;">
        <li><strong>Complete your profile</strong> — Add your DBS number, Ofsted URN, experience, and bio</li>
        <li><strong>Upload documents</strong> — DBS certificate, First Aid certificate, Insurance documents</li>
        <li><strong>Set your availability</strong> — Tell us which days and hours you're available</li>
        <li><strong>Set your area</strong> — Specify your location and maximum travel distance</li>
        <li><strong>Wait for verification</strong> — Our team will review your documents and schedule an interview</li>
        <li><strong>Go live!</strong> — Once verified, you'll start receiving shift offers</li>
      </ol>
    </div>
    <div style="background: #FEF3C7; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;"><strong>⏱ Typical timeline:</strong> Most childminders are verified within 5–10 working days after submitting all documents.</p>
    </div>
    <p style="color: #666; font-size: 14px;">Questions? Email us at <a href="mailto:hello@kinderstars.de" style="color: #059669;">hello@kinderstars.de</a></p>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://kinderstars.de/childminder/onboarding" style="display: inline-block; background: #059669; color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: bold;">Start Onboarding →</a>
    </div>
  </div>
  <div style="background: #F5F0EB; padding: 16px; text-align: center; font-size: 12px; color: #999;">
    KinderStars GmbH · Quality Childminding Agency<br/>hello@kinderstars.de
  </div>
</div>`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, firstName, role } = await req.json();

    if (!email || !role) {
      return new Response(JSON.stringify({ error: "Missing email or role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const isParent = role === "parent";
    const subject = isParent ? PARENT_SUBJECT : CHILDMINDER_SUBJECT;
    const html = isParent ? parentHtml(firstName || "") : childminderHtml(firstName || "");

    // Call the SMTP email function (falls back to send-email if SMTP not configured)
    const { error } = await supabase.functions.invoke("send-smtp-email", {
      body: { to: email, subject, html },
    });

    if (error) {
      console.error("Welcome email error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`✅ Welcome email sent to ${email} (${role})`);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-welcome-email error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
