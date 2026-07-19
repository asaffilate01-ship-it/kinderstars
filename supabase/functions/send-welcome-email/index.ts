import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PARENT_SUBJECT = "Willkommen bei KinderStars! 🌟 Ihr Elternkonto ist bereit";
const CHILDMINDER_SUBJECT = "Willkommen bei KinderStars! 🌟 Ihr Start als Betreuungsperson";

const parentHtml = (firstName: string) => `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFBF5; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #F97316, #FB923C); padding: 32px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Willkommen bei KinderStars! 🌟</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Qualitätsvolle Kinderbetreuung – einfach gemacht.</p>
  </div>
  <div style="padding: 32px;">
    <p style="font-size: 16px;">Hallo ${firstName || "zusammen"},</p>
    <p>Vielen Dank für Ihre Anmeldung bei KinderStars! So starten Sie:</p>
    <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #F97316;">📋 Ihre nächsten Schritte</h3>
      <ol style="line-height: 2;">
        <li><strong>Profil vervollständigen</strong> — Adresse, Präferenzen und Kontaktdaten ergänzen</li>
        <li><strong>Kinder anlegen</strong> — Daten, Allergien und Förderbedarf jedes Kindes erfassen</li>
        <li><strong>Förderung einrichten</strong> — Bei Anspruch nach § 23 SGB VIII Nachweise beim Jugendamt einreichen</li>
        <li><strong>Betreuung finden</strong> — Geprüfte Betreuungspersonen entdecken und Anfragen stellen</li>
        <li><strong>Buchungen verwalten</strong> — Termine, Rechnungen und Nachrichten an einem Ort</li>
      </ol>
    </div>
    <p style="color: #666; font-size: 14px;">Fragen? Antworten Sie einfach auf diese E-Mail oder schreiben Sie an <a href="mailto:hello@kinderstars.de" style="color: #F97316;">hello@kinderstars.de</a></p>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://kinderstars.de/parent" style="display: inline-block; background: #F97316; color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: bold;">Zum Dashboard →</a>
    </div>
  </div>
  <div style="background: #F5F0EB; padding: 16px; text-align: center; font-size: 12px; color: #999;">
    KinderStars GmbH · Vermittlung qualifizierter Kinderbetreuung<br/>hello@kinderstars.de
  </div>
</div>`;

const childminderHtml = (firstName: string) => `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFBF5; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #059669, #34D399); padding: 32px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Willkommen bei KinderStars! 🌟</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Werden Sie Teil unseres Betreuungsnetzwerks.</p>
  </div>
  <div style="padding: 32px;">
    <p style="font-size: 16px;">Hallo ${firstName || "zusammen"},</p>
    <p>Herzlich willkommen! Mit dieser Checkliste werden Sie verifiziert und erhalten erste Anfragen:</p>
    <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #059669;">📋 Onboarding-Checkliste</h3>
      <ol style="line-height: 2;">
        <li><strong>Profil vervollständigen</strong> — Erweitertes Führungszeugnis, Qualifikation, Erfahrung und Kurzprofil</li>
        <li><strong>Dokumente hochladen</strong> — Führungszeugnis (§ 30a BZRG), Erste-Hilfe-Nachweis, Belehrung nach § 43 IfSG, Versicherung</li>
        <li><strong>Verfügbarkeit hinterlegen</strong> — Tage und Zeiten angeben</li>
        <li><strong>Einsatzgebiet festlegen</strong> — Ort und maximale Entfernung wählen</li>
        <li><strong>Verifizierung abwarten</strong> — Unser Team prüft Ihre Unterlagen und lädt Sie zum Gespräch ein</li>
        <li><strong>Los geht's!</strong> — Nach Freigabe erhalten Sie Anfragen von Familien</li>
      </ol>
    </div>
    <div style="background: #FEF3C7; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;"><strong>⏱ Bearbeitungsdauer:</strong> In der Regel dauert die Verifizierung nach Einreichung aller Unterlagen 5–10 Werktage.</p>
    </div>
    <p style="color: #666; font-size: 14px;">Fragen? Schreiben Sie an <a href="mailto:hello@kinderstars.de" style="color: #059669;">hello@kinderstars.de</a></p>
    <div style="text-align: center; margin-top: 24px;">
      <a href="https://kinderstars.de/childminder/onboarding" style="display: inline-block; background: #059669; color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: bold;">Onboarding starten →</a>
    </div>
  </div>
  <div style="background: #F5F0EB; padding: 16px; text-align: center; font-size: 12px; color: #999;">
    KinderStars GmbH · Vermittlung qualifizierter Kinderbetreuung<br/>hello@kinderstars.de
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
