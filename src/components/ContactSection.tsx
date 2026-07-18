import { Button } from "@/components/ui/button";
import { useState, FormEvent } from "react";
import AnimatedSection from "@/components/AnimatedSection";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const enquiryTypes = [
  { value: "parent", label: "I'm a Parent looking for childcare" },
  { value: "childminder", label: "I'm a registered Childminder" },
  { value: "become-childminder", label: "I want to become a Childminder" },
  { value: "general", label: "General enquiry" },
];

const ContactSection = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [enquiryType, setEnquiryType] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setStatus("");

    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: { name, email, message, enquiryType },
      });

      if (error) throw error;

      setStatus("Message sent successfully! We'll get back to you soon.");
      setName("");
      setEmail("");
      setEnquiryType("");
      setMessage("");
    } catch {
      setStatus("Failed to send message. Please email us directly at info@kinderstars.co.uk");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="ks-card ks-section mt-4">
      <AnimatedSection>
        <h2 className="text-2xl font-bold tracking-tight mb-1.5">{t("contact.heading")}</h2>
        <p className="text-muted-foreground text-sm">{t("contact.description")}</p>
      </AnimatedSection>

      <div className="grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-3 mt-3">
        <AnimatedSection delay={0.1}>
          <div className="ks-contact-card h-full">
            <strong>{t("contact.companyName")}</strong>
            <ul className="list-none p-0 mt-2.5 space-y-1.5 text-muted-foreground text-[13.5px]">
              <li><strong>{t("contact.email")}</strong> <a href="mailto:info@kinderstars.co.uk" className="underline">info@kinderstars.co.uk</a></li>
              <li><strong>{t("contact.address")}</strong> {t("contact.addressValue")}</li>
            </ul>
            <div className="mt-3 flex gap-2.5 flex-wrap">
              <Button variant="hero" asChild>
                <a href="mailto:info@kinderstars.co.uk?subject=Enquiry%20-%20KinderStars">{t("contact.emailUs")}</a>
              </Button>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <div className="ks-contact-card h-full">
            <strong>{t("contact.quickMessage")}</strong>
            <p className="text-muted-foreground text-[13.5px] mt-2">{t("contact.quickMessageDesc")}</p>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2.5" onSubmit={handleSubmit}>
              <div className="ks-field">
                <label htmlFor="contact-name">{t("contact.nameLabel")}</label>
                <input id="contact-name" required value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
              </div>
              <div className="ks-field">
                <label htmlFor="contact-email">{t("contact.emailLabel")}</label>
                <input id="contact-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
              </div>
              <div className="ks-field md:col-span-2">
                <label htmlFor="contact-type">I am a…</label>
                <select id="contact-type" required value={enquiryType} onChange={(e) => setEnquiryType(e.target.value)}>
                  <option value="" disabled>Select enquiry type</option>
                  {enquiryTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="ks-field md:col-span-2">
                <label htmlFor="contact-message">{t("contact.messageLabel")}</label>
                <textarea id="contact-message" required placeholder={t("contact.messagePlaceholder")} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} />
              </div>
              <div className="md:col-span-2 flex gap-2.5 items-center flex-wrap">
                <Button variant="hero" type="submit" disabled={sending} className="gap-2">
                  {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {sending ? "Sending…" : t("contact.send")}
                </Button>
                {status && <span className={`text-xs ${status.includes("success") ? "text-success" : "text-muted-foreground"}`}>{status}</span>}
              </div>
            </form>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default ContactSection;
