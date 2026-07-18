import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";

const PlaceholderPage = () => {
  const { pathname } = useLocation();
  const pageName = pathname.split("/").pop() || "Page";
  const title = pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, " ");

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="ks-icon-box mb-4">
        <Construction className="w-6 h-6 text-primary" />
      </div>
      <h1 className="text-xl font-bold tracking-tight mb-2">{title}</h1>
      <p className="text-muted-foreground text-sm max-w-md">
        This section is coming soon. We're building it out as part of the KinderStars platform.
      </p>
    </div>
  );
};

export default PlaceholderPage;
