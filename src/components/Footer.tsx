import logo from "@/assets/kinderstars-logo.png";
import { useTranslation } from "react-i18next";
import { Facebook, Instagram, Twitter, Linkedin, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="mt-8 border-t border-border pt-6 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-6">
        <div>
          <div className="flex items-center gap-1 mb-3" dir="ltr">
            <img src={logo} alt="KinderStars logo" className="w-[140px] h-auto opacity-80" />
            <span className="text-[9px] font-bold leading-none" style={{ color: '#1a5276' }}>®</span>
          </div>
          <p className="text-muted-foreground text-xs max-w-[32ch] leading-relaxed">{t("footer.companyDesc")}</p>
          <div className="flex gap-3 mt-3">
            <a href="https://facebook.com/kinderstars" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-muted-foreground hover:text-foreground transition-colors"><Facebook className="w-4 h-4" /></a>
            <a href="https://instagram.com/kinderstars" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-muted-foreground hover:text-foreground transition-colors"><Instagram className="w-4 h-4" /></a>
            <a href="https://twitter.com/kinderstars" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-muted-foreground hover:text-foreground transition-colors"><Twitter className="w-4 h-4" /></a>
            <a href="https://linkedin.com/company/kinderstars" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-muted-foreground hover:text-foreground transition-colors"><Linkedin className="w-4 h-4" /></a>
            <a href="https://youtube.com/@kinderstars" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-muted-foreground hover:text-foreground transition-colors"><Youtube className="w-4 h-4" /></a>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-2.5">{t("footer.navigate")}</h4>
          <ul className="space-y-1.5 text-xs text-muted-foreground list-none p-0 m-0">
            <li><a href="/" className="hover:text-foreground transition-colors">{t("footer.home")}</a></li>
            <li><a href="/#parents" className="hover:text-foreground transition-colors">{t("footer.forParents")}</a></li>
            <li><a href="/#how-it-works" className="hover:text-foreground transition-colors">{t("footer.howItWorks")}</a></li>
            <li><a href="/#for-childminders" className="hover:text-foreground transition-colors">{t("footer.forChildminders")}</a></li>
            <li><a href="/#directory" className="hover:text-foreground transition-colors">{t("footer.findChildminder")}</a></li>
            <li><a href="/#faq" className="hover:text-foreground transition-colors">{t("footer.faq")}</a></li>
            <li><a href="/#contact" className="hover:text-foreground transition-colors">{t("footer.contact")}</a></li>
            <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-2.5">{t("footer.contactHeading")}</h4>
          <ul className="space-y-1.5 text-xs text-muted-foreground list-none p-0 m-0">
            <li><a href="mailto:info@kinderstars.co.uk" className="hover:text-foreground transition-colors">info@kinderstars.co.uk</a></li>
            <li>{t("contact.addressValue")}</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-2.5">{t("footer.legal")}</h4>
          <ul className="space-y-1.5 text-xs text-muted-foreground list-none p-0 m-0">
            <li><Link to="/privacy-policy" className="hover:text-foreground transition-colors">{t("footer.privacyPolicy")}</Link></li>
            <li><Link to="/terms-of-service" className="hover:text-foreground transition-colors">{t("footer.termsOfService")}</Link></li>
            <li><Link to="/complaints-procedure" className="hover:text-foreground transition-colors">{t("footer.complaintsProcedure")}</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-foreground transition-colors">{t("footer.gdpr")}</Link></li>
          </ul>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border flex flex-wrap gap-2.5 justify-between text-muted-foreground/60 text-[11px]">
        <div>{t("footer.copyright", { year: new Date().getFullYear() })}</div>
        <div>Powered by ThreeOneThree Ventures</div>
      </div>
    </footer>
  );
};

export default Footer;
