import { Facebook, Twitter, Linkedin, Link2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
}

const SocialShare = ({ url, title, description }: SocialShareProps) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description || "");

  const shareLinks = [
    {
      label: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "hover:text-[#1877F2]",
    },
    {
      label: "X (Twitter)",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: "hover:text-foreground",
    },
    {
      label: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: "hover:text-[#0A66C2]",
    },
    {
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: "hover:text-[#25D366]",
    },
  ];

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground font-medium mr-1">Share:</span>
      {shareLinks.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${s.label}`}
          className={`p-2 rounded-lg border border-border bg-card text-muted-foreground ${s.color} transition-colors`}
        >
          <s.icon className="w-4 h-4" />
        </a>
      ))}
      <button
        onClick={copyLink}
        aria-label="Copy link"
        className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-secondary transition-colors"
      >
        <Link2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default SocialShare;
