import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const bookingConfirmationHtml = (
  parentName: string,
  childminderName: string,
  date: string,
  startTime: string,
  endTime: string,
  status: string
) => `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFBF5; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #1a5276, #2980b9); padding: 24px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Buchung ${status === "confirmed" ? "bestätigt ✅" : "aktualisiert 📋"}</h1>
  </div>
  <div style="padding: 28px;">
    <p style="font-size: 16px;">Hallo ${parentName},</p>
    <p>Ihre Buchung wurde <strong>${status}</strong>.</p>
    <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #F97316;">
      <table style="width: 100%; font-size: 14px;">
        <tr><td style="padding: 6px 0; color: #666;">Betreuungsperson</td><td style="padding: 6px 0; font-weight: bold;">${childminderName}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Datum</td><td style="padding: 6px 0; font-weight: bold;">${date}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Uhrzeit</td><td style="padding: 6px 0; font-weight: bold;">${startTime} – ${endTime}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Status</td><td style="padding: 6px 0;"><span style="background: ${status === "confirmed" ? "#dcfce7" : "#fef3c7"}; color: ${status === "confirmed" ? "#166534" : "#92400e"}; padding: 2px 10px; border-radius: 8px; font-weight: bold; font-size: 12px;">${status.toUpperCase()}</span></td></tr>
      </table>
    </div>
    <div style="text-align: center; margin-top: 20px;">
      <a href="https://kinderstars.de/parent/bookings" style="display: inline-block; background: #F97316; color: white; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: bold;">Buchungen ansehen →</a>
    </div>
  </div>
  <div style="background: #F5F0EB; padding: 14px; text-align: center; font-size: 12px; color: #999;">
    KinderStars GmbH · hello@kinderstars.de
  </div>
</div>`;

const passwordResetHtml = (firstName: string, resetLink: string) => `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFBF5; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #1a5276, #2980b9); padding: 24px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Passwort zurücksetzen 🔑</h1>
  </div>
  <div style="padding: 28px;">
    <p style="font-size: 16px;">Hallo ${firstName || "zusammen"},</p>
    <p>Wir haben eine Anfrage zum Zurücksetzen Ihres KinderStars-Passworts erhalten. Klicken Sie unten, um ein neues zu vergeben:</p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetLink}" style="display: inline-block; background: #F97316; color: white; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">Passwort zurücksetzen →</a>
    </div>
    <p style="color: #666; font-size: 13px;">Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail. Der Link ist 1 Stunde gültig.</p>
  </div>
  <div style="background: #F5F0EB; padding: 14px; text-align: center; font-size: 12px; color: #999;">
    KinderStars GmbH · hello@kinderstars.de
  </div>
</div>`;

const verificationHtml = (firstName: string, confirmLink: string) => `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFBF5; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #F97316, #FB923C); padding: 28px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">E-Mail bestätigen ✉️</h1>
  </div>
  <div style="padding: 28px;">
    <p style="font-size: 16px;">Hallo ${firstName || "zusammen"},</p>
    <p>Danke für Ihre Anmeldung bei KinderStars! Bitte bestätigen Sie Ihre E-Mail-Adresse, um loszulegen:</p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${confirmLink}" style="display: inline-block; background: #F97316; color: white; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">E-Mail bestätigen →</a>
    </div>
    <p style="color: #666; font-size: 13px;">Falls Sie kein Konto erstellt haben, ignorieren Sie diese E-Mail.</p>
  </div>
  <div style="background: #F5F0EB; padding: 14px; text-align: center; font-size: 12px; color: #999;">
    KinderStars GmbH · hello@kinderstars.de
  </div>
</div>`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { template, ...params } = body;

    let subject = "";
    let html = "";

    switch (template) {
      case "booking_confirmation":
        subject = `Buchung ${params.status === "confirmed" ? "bestätigt" : "aktualisiert"} – KinderStars`;
        html = bookingConfirmationHtml(
          params.parent_name || "Parent",
          params.childminder_name || "Childminder",
          params.date || "",
          params.start_time || "",
          params.end_time || "",
          params.status || "pending"
        );
        break;
      case "password_reset":
        subject = "Passwort zurücksetzen – KinderStars";
        html = passwordResetHtml(params.first_name || "", params.reset_link || "");
        break;
      case "verification":
        subject = "E-Mail bestätigen – KinderStars";
        html = verificationHtml(params.first_name || "", params.confirm_link || "");
        break;
      default:
        return new Response(JSON.stringify({ error: "Unknown template. Use: booking_confirmation, password_reset, verification" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Forward to SMTP sender
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error } = await supabase.functions.invoke("send-smtp-email", {
      body: { to: params.to, subject, html },
    });

    if (error) {
      console.error("Email template send error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, template }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("branded-email error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
