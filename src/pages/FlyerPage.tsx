import { useRef } from "react";
import html2canvas from "html2canvas";
import logo from "@/assets/kinderstars-logo.png";
import { Star, Phone, Mail, CheckCircle2, HelpCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const FlyerPage = () => {
  const flyerRef = useRef<HTMLDivElement>(null);

  const downloadPNG = async () => {
    if (!flyerRef.current) return;
    const canvas = await html2canvas(flyerRef.current, { scale: 3, useCORS: true });
    const link = document.createElement("a");
    link.download = "KinderStars-Flyer.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const downloadPDF = () => window.print();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 print:p-0">
      <div className="flex gap-3 mb-4 print:hidden">
        <Button variant="hero" size="sm" onClick={downloadPNG} className="gap-1.5">
          <Download className="w-4 h-4" /> Download PNG
        </Button>
        <Button variant="outline" size="sm" onClick={downloadPDF} className="gap-1.5">
          <Download className="w-4 h-4" /> Print / PDF
        </Button>
      </div>
      <div ref={flyerRef} className="w-full max-w-[500px] bg-card shadow-2xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none" style={{ aspectRatio: "148/210" }}>
        {/* Navy Header */}
        <div className="relative px-6 pt-6 pb-5 text-center" style={{ background: "hsl(222, 95%, 13%)" }}>
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <Star key={i} className="absolute text-primary/20 fill-primary/10" style={{
                width: `${16 + i * 4}px`, height: `${16 + i * 4}px`,
                top: `${[5, 60, 15, 70, 30, 80, 10, 50][i]}%`,
                left: `${[5, 85, 90, 10, 50, 70, 35, 92][i]}%`,
                transform: `rotate(${i * 45}deg)`,
              }} />
            ))}
          </div>
          <img src={logo} alt="KinderStars" className="w-[160px] mx-auto relative z-10 brightness-0 invert" />
          <p className="text-primary text-[11px] font-bold tracking-widest mt-1 relative z-10">UK WIDE CHILDMINDER AGENCY</p>
        </div>

        {/* Gold Headline Banner */}
        <div className="px-6 py-4 text-center" style={{ background: "linear-gradient(135deg, hsl(44, 93%, 57%), hsl(44, 93%, 65%))" }}>
          <h1 className="text-xl font-black tracking-tight" style={{ color: "hsl(222, 95%, 13%)" }}>
            CHILDCARE GRANT
          </h1>
          <p className="text-xs font-bold mt-0.5" style={{ color: "hsl(222, 95%, 13%)" }}>
            For Full-Time Students
          </p>
        </div>

        {/* Main Content */}
        <div className="px-6 py-4 space-y-3">
          {/* Key Info Box */}
          <div className="rounded-xl p-3 border-2" style={{ borderColor: "hsl(44, 93%, 57%)", background: "hsl(44, 93%, 57%, 0.08)" }}>
            <p className="text-xs leading-relaxed font-medium text-foreground">
              Full-time higher-education students <strong>eligible for Student Finance England funding</strong> can apply for a <strong>Childcare Grant (CCG)</strong> to help cover up to <strong className="text-lg" style={{ color: "hsl(222, 95%, 13%)" }}>85%</strong> of childcare costs.
            </p>
          </div>

          {/* Bullet Points */}
          <div className="space-y-1.5">
            {[
              "Nach § 43 SGB VIII zugelassen",
              "Flexible hours to fit your timetable",
              "Available across the UK",
              "Erweitertes Führungszeugnis geprüft",
              "Support with funding applications",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(155, 87%, 24%)" }} />
                <span className="text-[11px] text-foreground">{item}</span>
              </div>
            ))}
          </div>

          {/* FAQs */}
          <div className="pt-2 border-t" style={{ borderColor: "hsl(44, 93%, 57%, 0.3)" }}>
            <div className="flex items-center gap-1 mb-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">FAQs</span>
            </div>
            <div className="space-y-1.5">
              {[
                { q: "Wer kann Zuschüsse beantragen?", a: "Eltern über das Jugendamt (§ 23 SGB VIII), Studierende mit BAföG-KiZ und Beschäftigte mit Arbeitgeberzuschuss (§ 3 Nr. 33 EStG)." },
                { q: "Wie viel wird übernommen?", a: "Je nach Einkommen und Bundesland – teilweise oder vollständige Übernahme der Kindertagespflege-Kosten durch das Jugendamt." },
                { q: "Sind alle Betreuungspersonen geprüft?", a: "Ja – alle KinderStars-Betreuungspersonen sind nach § 43 SGB VIII zugelassen und legen ein erweitertes Führungszeugnis vor." },
              ].map((faq) => (
                <div key={faq.q}>
                  <p className="text-[10px] font-bold text-foreground">{faq.q}</p>
                  <p className="text-[9px] text-muted-foreground leading-snug">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Services */}
          <div className="pt-2 border-t" style={{ borderColor: "hsl(44, 93%, 57%, 0.3)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Unsere Leistungen</p>
            <div className="flex flex-wrap gap-1">
              {["Randzeitenbetreuung", "Schul-/Kita-Abholung", "Ferienbetreuung", "Notfallbetreuung", "Inklusion & Förderbedarf", "Früh- & Spätdienst"].map((s) => (
                <span key={s} className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ background: "hsl(200, 93%, 23%, 0.1)", color: "hsl(200, 93%, 23%)" }}>{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Contact Bar */}
        <div className="px-6 py-3 flex items-center justify-between gap-3" style={{ background: "hsl(222, 95%, 13%)" }}>
          <div className="flex items-center gap-4">
            <a href="mailto:hello@kinderstars.de" className="flex items-center gap-1.5 text-white/90 hover:text-white transition-colors">
              <Mail className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-medium">hello@kinderstars.de</span>
            </a>
            <a href="tel:07585803505" className="flex items-center gap-1.5 text-white/90 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-medium">07585 803505</span>
            </a>
          </div>
          <Star className="w-4 h-4 text-primary fill-primary" />
        </div>
      </div>
    </div>
  );
};

export default FlyerPage;
