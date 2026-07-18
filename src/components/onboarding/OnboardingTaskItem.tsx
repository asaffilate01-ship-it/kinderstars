import { CheckCircle2, Circle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface OnboardingTaskItemProps {
  label: string;
  done: boolean;
  icon: LucideIcon;
  disabled?: boolean;
  requiresDoc?: boolean;
  docStatus?: string | null; // "pending" | "approved" | "rejected" | null
  onToggle?: () => void;
  onUpload?: () => void;
}

const DOC_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending Review", cls: "bg-warning/15 text-warning" },
  approved: { label: "Approved", cls: "bg-success/15 text-success" },
  rejected: { label: "Rejected — Re-upload", cls: "bg-destructive/15 text-destructive" },
};

const OnboardingTaskItem = ({
  label,
  done,
  icon: Icon,
  disabled,
  requiresDoc,
  docStatus,
  onToggle,
  onUpload,
}: OnboardingTaskItemProps) => {
  if (requiresDoc) {
    const badge = docStatus ? DOC_STATUS_BADGE[docStatus] : null;

    return (
      <div className="flex items-center gap-3 py-3 text-left">
        {done ? (
          <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
        )}
        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
        <span
          className={cn(
            "text-sm flex-1",
            docStatus === "approved" && "line-through text-muted-foreground"
          )}
        >
          {label}
        </span>

        {badge ? (
          <span className={cn("text-[11px] px-2 py-1 rounded-full font-bold shrink-0", badge.cls)}>
            {badge.label}
          </span>
        ) : !disabled ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs shrink-0"
            onClick={onUpload}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className="w-full flex items-center gap-3 py-3 text-left hover:bg-muted/30 transition-colors disabled:opacity-60 rounded-md px-1"
    >
      {done ? (
        <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
      ) : (
        <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
      )}
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className={cn("text-sm", done && "line-through text-muted-foreground")}>
        {label}
      </span>
    </button>
  );
};

export default OnboardingTaskItem;
