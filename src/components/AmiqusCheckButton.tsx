import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Shield, Fingerprint, FileCheck, Loader2, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";

interface AmiqusCheckButtonProps {
  checkType: "dbs" | "identity" | "right_to_work" | "full";
  firstName: string;
  lastName: string;
  email: string;
  existingStatus?: string | null; // from compliance_documents
  label?: string;
  className?: string;
}

const CHECK_META: Record<string, { icon: typeof Shield; label: string; description: string }> = {
  dbs: { icon: Shield, label: "DBS Check", description: "Enhanced DBS / PVG / AccessNI criminal record check" },
  identity: { icon: Fingerprint, label: "ID Verification", description: "Photo ID and liveness verification" },
  right_to_work: { icon: FileCheck, label: "Right to Work", description: "Verify eligibility to work in the UK" },
  full: { icon: Shield, label: "Full Background Check", description: "DBS + ID verification + right to work" },
};

const STATUS_DISPLAY: Record<string, { label: string; className: string }> = {
  pending: { label: "Processing…", className: "text-primary" },
  in_review: { label: "In Progress", className: "text-primary" },
  approved: { label: "Approved ✅", className: "text-success" },
  rejected: { label: "Requires Review", className: "text-destructive" },
};

const AmiqusCheckButton = ({
  checkType,
  firstName,
  lastName,
  email,
  existingStatus,
  label,
  className = "",
}: AmiqusCheckButtonProps) => {
  const [loading, setLoading] = useState(false);
  const meta = CHECK_META[checkType] || CHECK_META.dbs;
  const Icon = meta.icon;

  const statusInfo = existingStatus ? STATUS_DISPLAY[existingStatus] : null;

  const handleInitiate = async () => {
    if (!firstName || !lastName || !email) {
      toast({ title: "Missing details", description: "Please complete your profile first.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("amiqus-create-check", {
        body: { check_type: checkType, first_name: firstName, last_name: lastName, email },
      });

      if (error) throw error;

      if (data?.error) {
        if (data.error.includes("not configured")) {
          toast({
            title: "Amiqus not configured",
            description: "The verification service is being set up. Please try again later or contact KinderStars.",
            variant: "destructive",
          });
        } else {
          throw new Error(data.error);
        }
        return;
      }

      toast({
        title: "Check initiated! 🎉",
        description: "You'll receive an email from Amiqus with instructions to complete the verification.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initiate check";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Already completed
  if (existingStatus === "approved") {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <CheckCircle2 className="w-4 h-4 text-success" />
        <span className="text-success font-medium">{meta.label} — Approved</span>
      </div>
    );
  }

  // In progress
  if (existingStatus === "pending" || existingStatus === "in_review") {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-primary font-medium">{meta.label} — {statusInfo?.label || "Processing"}</span>
      </div>
    );
  }

  // Rejected — allow retry
  if (existingStatus === "rejected") {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />
          <span className="font-medium">{meta.label} — Requires Review</span>
        </div>
        <Button size="sm" variant="outline" onClick={handleInitiate} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
          Retry Check
        </Button>
      </div>
    );
  }

  // Not started
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleInitiate}
      disabled={loading}
      className={`gap-1.5 ${className}`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Icon className="w-3.5 h-3.5" />
      )}
      {label || `Start ${meta.label}`}
    </Button>
  );
};

export default AmiqusCheckButton;
