import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, Lock, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingStageProps {
  title: string;
  description?: string;
  stageNumber: number;
  isComplete: boolean;
  isLocked: boolean;
  isActive: boolean;
  children: React.ReactNode;
}

const OnboardingStage = ({
  title,
  description,
  stageNumber,
  isComplete,
  isLocked,
  isActive,
  children,
}: OnboardingStageProps) => {
  const [isOpen, setIsOpen] = useState(isActive && !isLocked);

  const toggle = () => {
    if (!isLocked) setIsOpen((prev) => !prev);
  };

  return (
    <div
      className={cn(
        "ks-card overflow-hidden transition-all",
        isLocked && "opacity-60",
        isActive && !isLocked && "ring-2 ring-primary/30"
      )}
    >
      {/* Header */}
      <button
        onClick={toggle}
        disabled={isLocked}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors disabled:cursor-not-allowed"
      >
        {/* Stage indicator */}
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
            isComplete
              ? "bg-success/15 text-success"
              : isLocked
              ? "bg-muted text-muted-foreground"
              : "bg-primary/10 text-primary"
          )}
        >
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : isLocked ? (
            <Lock className="w-4 h-4" />
          ) : (
            stageNumber
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn("font-bold text-sm", isComplete && "text-success")}>
            {title}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>

        {!isLocked && (
          <span className="text-muted-foreground shrink-0">
            {isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        )}
      </button>

      {/* Content */}
      {isOpen && !isLocked && (
        <div className="border-t border-border px-4 pb-4 pt-3">{children}</div>
      )}
    </div>
  );
};

export default OnboardingStage;
