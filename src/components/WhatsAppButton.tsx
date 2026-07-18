import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "447585803505";
const WHATSAPP_MESSAGE = encodeURIComponent("Hi KinderStars! I'd like to enquire about childminding services.");

const WhatsAppButton = () => {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group md:bottom-6"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="hidden group-hover:inline text-sm font-medium whitespace-nowrap">
        Chat with us
      </span>
    </a>
  );
};

export default WhatsAppButton;
