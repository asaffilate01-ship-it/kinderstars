import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "cy", label: "Cymraeg", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "ur", label: "اردو", flag: "🇵🇰" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "sk", label: "Slovenčina", flag: "🇸🇰" },
  { code: "cs", label: "Čeština", flag: "🇨🇿" },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const handleChange = (value: string) => {
    i18n.changeLanguage(value);
    document.documentElement.dir = value === "ar" || value === "ur" ? "rtl" : "ltr";
    document.documentElement.lang = value;
  };

  return (
    <Select value={i18n.language} onValueChange={handleChange}>
      <SelectTrigger className="w-full gap-2 text-sm h-9">
        <Globe className="w-3.5 h-3.5 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSwitcher;
