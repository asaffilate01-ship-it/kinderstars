import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, FileText, Shield, UserCheck, ClipboardList,
  Loader2, AlertTriangle, Home, Phone, ExternalLink,
} from "lucide-react";
import OnboardingStage from "@/components/onboarding/OnboardingStage";
import OnboardingTaskItem from "@/components/onboarding/OnboardingTaskItem";
import AmiqusCheckButton from "@/components/AmiqusCheckButton";

const DOCUMENT_TASKS: Record<string, string> = {
  id_verification: "other",
  address_proof: "proof_of_address",
};

// Stage 1: Personal details — with navigation targets
const PERSONAL_TASKS = [
  { key: "profile_complete", label: "Complete your personal details (name, phone, address)", icon: UserCheck, requiresDoc: false, navigateTo: "/parent/profile" },
  { key: "address_verification", label: "Confirm your home address and postcode", icon: Home, requiresDoc: false, navigateTo: "/parent/profile" },
  { key: "emergency_contact", label: "Provide emergency contact details", icon: Phone, requiresDoc: false, navigateTo: "/parent/profile" },
];

// Stage 2: Identity & children
const IDENTITY_TASKS = [
  { key: "id_verification", label: "Upload proof of identity (passport or driving licence)", icon: Shield, requiresDoc: true },
  { key: "address_proof", label: "Upload proof of address (utility bill or bank statement)", icon: Home, requiresDoc: true },
  { key: "children_registered", label: "Register at least one child with full details", icon: UserCheck, requiresDoc: false, navigateTo: "/parent/children" },
];

// Stage 3: Policies & funding
const POLICY_TASKS = [
  { key: "safeguarding_accepted", label: "Read and accept the safeguarding policy", icon: Shield, requiresDoc: false },
  { key: "funding_configured", label: "Configure your funding / payment method", icon: FileText, requiresDoc: false, navigateTo: "/parent/funding" },
  { key: "terms_accepted", label: "Accept terms of service and privacy policy", icon: ClipboardList, requiresDoc: false },
];

const ALL_TASKS = [...PERSONAL_TASKS, ...IDENTITY_TASKS, ...POLICY_TASKS];

type OnboardingStatus = "pending" | "submitted" | "verified" | "rejected";

const STATUS_LABELS: Record<OnboardingStatus, { label: string; color: string; description: string }> = {
  pending: { label: "Getting Started", color: "text-muted-foreground", description: "Complete all stages and submit for verification." },
  submitted: { label: "Documents Submitted — Under Review", color: "text-primary", description: "Your details are being reviewed by KinderStars." },
  verified: { label: "✅ Verified — You can browse childminders!", color: "text-success", description: "Your account is fully verified. All features are unlocked." },
  rejected: { label: "Verification Unsuccessful — Contact KinderStars", color: "text-destructive", description: "Please contact KinderStars for more information." },
};

const ParentOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Record<string, boolean>>({});
  const [docStatuses, setDocStatuses] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<OnboardingStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: parentProfile } = await supabase
      .from("parent_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!parentProfile) {
      await supabase.from("parent_profiles").insert({ user_id: user.id });
    }

    const [{ data: taskRows }, { data: docs }] = await Promise.all([
      supabase.from("onboarding_tasks").select("task_key, completed").eq("user_id", user.id),
      supabase.from("compliance_documents").select("document_type, status").eq("user_id", user.id),
    ]);

    const map: Record<string, boolean> = {};
    ALL_TASKS.filter((t) => !t.requiresDoc).forEach((t) => (map[t.key] = false));
    taskRows?.forEach((r) => {
      if (!DOCUMENT_TASKS[r.task_key]) map[r.task_key] = r.completed;
    });

    const dStatuses: Record<string, string> = {};
    Object.entries(DOCUMENT_TASKS).forEach(([taskKey, docType]) => {
      const doc = docs?.find((d) => d.document_type === docType);
      if (doc) {
        dStatuses[taskKey] = doc.status || "pending";
        map[taskKey] = doc.status === "approved";
      }
    });
    setTasks(map);
    setDocStatuses(dStatuses);

    const submittedTask = taskRows?.find((r) => r.task_key === "parent_submitted" && r.completed);
    const verifiedTask = taskRows?.find((r) => r.task_key === "parent_verified" && r.completed);
    const rejectedTask = taskRows?.find((r) => r.task_key === "parent_rejected" && r.completed);

    if (verifiedTask) setStatus("verified");
    else if (rejectedTask) setStatus("rejected");
    else if (submittedTask) setStatus("submitted");
    else setStatus("pending");

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, loadData]);

  // Realtime: listen for document status changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("onboarding-realtime-parent")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "compliance_documents", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const doc = payload.new as { document_type: string; status: string };
          const taskKey = Object.entries(DOCUMENT_TASKS).find(([, docType]) => docType === doc.document_type)?.[0];
          if (taskKey) {
            setDocStatuses((prev) => ({ ...prev, [taskKey]: doc.status }));
            setTasks((prev) => ({ ...prev, [taskKey]: doc.status === "approved" }));

            if (doc.status === "approved") {
              toast({ title: "Document Approved ✅", description: `Your ${doc.document_type.replace(/_/g, " ")} has been approved.` });
            } else if (doc.status === "rejected") {
              toast({ title: "Document Rejected", description: `Your ${doc.document_type.replace(/_/g, " ")} needs to be re-uploaded.`, variant: "destructive" });
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "onboarding_tasks", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const task = payload.new as { task_key: string; completed: boolean };
          if (task.task_key === "parent_verified" && task.completed) {
            setStatus("verified");
            toast({ title: "🎉 You're verified!", description: "You can now search for childminders and make bookings." });
          } else if (task.task_key === "parent_rejected" && task.completed) {
            setStatus("rejected");
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const toggleTask = async (key: string) => {
    if (!user || status === "verified") return;
    const task = ALL_TASKS.find((t) => t.key === key);
    if (task?.requiresDoc) return;

    const newVal = !tasks[key];
    setTasks((prev) => ({ ...prev, [key]: newVal }));

    await supabase.from("onboarding_tasks").upsert(
      {
        user_id: user.id,
        task_key: key,
        task_label: task?.label || key,
        completed: newVal,
        completed_at: newVal ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,task_key" }
    );

    if (newVal) {
      toast({ title: "Task completed ✓", description: task?.label || key });
    }
  };

  // Stage completion
  const personalComplete = PERSONAL_TASKS.every((t) => tasks[t.key]);
  const idUploaded = !!docStatuses["id_verification"];
  const idApproved = docStatuses["id_verification"] === "approved";
  const addressUploaded = !!docStatuses["address_proof"];
  const addressApproved = docStatuses["address_proof"] === "approved";
  const allDocsApproved = idApproved && addressApproved;
  const docsAnyRejected = Object.values(docStatuses).some((s) => s === "rejected");
  const identityComplete = allDocsApproved && !!tasks["children_registered"];
  const policyComplete = POLICY_TASKS.every((t) => tasks[t.key]);
  const allDone = personalComplete && identityComplete && policyComplete;

  const completedCount = ALL_TASKS.filter((t) => tasks[t.key]).length;
  const progress = Math.round((completedCount / ALL_TASKS.length) * 100);

  const handleSubmit = async () => {
    if (!user || !allDone) return;
    setSubmitting(true);

    await supabase.from("onboarding_tasks").upsert(
      {
        user_id: user.id,
        task_key: "parent_submitted",
        task_label: "Parent onboarding submitted",
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,task_key" }
    );

    supabase.functions.invoke("send-contact-email", {
      body: {
        name: user.user_metadata?.first_name || "Parent",
        email: user.email || "",
        message: `PARENT ONBOARDING SUBMITTED\n\nUser ID: ${user.id}\nEmail: ${user.email}\nAll KYC tasks completed. Please review and verify.`,
      },
    }).catch(() => {});

    setStatus("submitted");
    setSubmitting(false);
    toast({ title: "Onboarding submitted! 📋", description: "KinderStars will review your details and verify your account." });
  };

  const goToDocUpload = () => navigate("/parent/documents");

  if (loading) return <div className="text-muted-foreground p-4">Loading onboarding…</div>;

  const isVerified = status === "verified";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Parent Onboarding</h1>
        <p className="text-muted-foreground text-sm">Complete all verification steps to access childminder search and bookings.</p>
      </div>

      {/* Status banner */}
      <div className="ks-card p-4 flex items-center gap-3">
        {status === "rejected" ? (
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
        ) : isVerified ? (
          <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
        ) : (
          <ClipboardList className="w-5 h-5 text-primary shrink-0" />
        )}
        <div>
          <p className={`font-bold text-sm ${STATUS_LABELS[status].color}`}>
            {STATUS_LABELS[status].label}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {STATUS_LABELS[status].description}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{completedCount} of {ALL_TASKS.length} steps</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Safeguarding notice */}
      <div className="ks-card p-4 bg-primary/5 border-primary/20">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">🛡️ Why we verify parents:</strong> KinderStars operates a two-way safeguarding model. Your identity and contact details are kept confidential and used solely for safeguarding purposes.
        </p>
      </div>

      {/* Stage 1: Personal Details */}
      <OnboardingStage
        title="Personal Details"
        description={personalComplete ? "All personal details confirmed" : "Name, address, phone, and emergency contact"}
        stageNumber={1}
        isComplete={personalComplete}
        isLocked={false}
        isActive={!personalComplete}
      >
        <div className="divide-y divide-border">
          {PERSONAL_TASKS.map((task) => (
            <div key={task.key} className="flex items-center gap-1">
              <div className="flex-1">
                <OnboardingTaskItem
                  label={task.label}
                  icon={task.icon}
                  done={!!tasks[task.key]}
                  disabled={isVerified}
                  onToggle={() => toggleTask(task.key)}
                />
              </div>
              {!tasks[task.key] && task.navigateTo && !isVerified && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 shrink-0 text-primary"
                  onClick={() => navigate(task.navigateTo!)}
                >
                  Go <ExternalLink className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </OnboardingStage>

      {/* Stage 2: Identity & Children */}
      <OnboardingStage
        title="Identity & Children"
        description={identityComplete ? "Identity verified and children registered" : docsAnyRejected ? "⚠️ Some documents need re-uploading" : "Upload ID, proof of address, and register your children"}
        stageNumber={2}
        isComplete={identityComplete}
        isLocked={!personalComplete}
        isActive={personalComplete && !identityComplete}
      >
        <div className="divide-y divide-border">
          {IDENTITY_TASKS.map((task) => (
            <div key={task.key} className="flex items-center gap-1">
              <div className="flex-1">
                <OnboardingTaskItem
                  label={task.label}
                  icon={task.icon}
                  done={task.requiresDoc ? docStatuses[task.key] === "approved" : !!tasks[task.key]}
                  disabled={isVerified}
                  requiresDoc={task.requiresDoc}
                  docStatus={task.requiresDoc ? docStatuses[task.key] || null : undefined}
                  onToggle={task.requiresDoc ? undefined : () => toggleTask(task.key)}
                  onUpload={task.requiresDoc ? goToDocUpload : undefined}
                />
              </div>
              {!task.requiresDoc && !tasks[task.key] && (task as any).navigateTo && !isVerified && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 shrink-0 text-primary"
                  onClick={() => navigate((task as any).navigateTo)}
                >
                  Go <ExternalLink className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Amiqus ID verification for parents */}
        {user && personalComplete && !isVerified && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border space-y-2">
            <p className="text-xs font-semibold text-foreground">🔒 Verify your identity digitally via Amiqus</p>
            <p className="text-[11px] text-muted-foreground">Complete your ID verification online — no need to post documents.</p>
            <AmiqusCheckButton
              checkType="identity"
              firstName={user.user_metadata?.first_name || ""}
              lastName={user.user_metadata?.last_name || ""}
              email={user.email || ""}
              existingStatus={docStatuses["id_verification"]}
              label="Start ID Verification"
            />
          </div>
        )}

        {docsAnyRejected && (
          <p className="text-xs text-destructive mt-3 font-medium">
            ⚠️ One or more documents were rejected. Please re-upload via the Documents page.
          </p>
        )}
      </OnboardingStage>

      {/* Stage 3: Policies & Funding */}
      <OnboardingStage
        title="Policies & Funding"
        description={policyComplete ? "All policies accepted and funding configured" : "Accept safeguarding policy, configure payment, and agree to terms"}
        stageNumber={3}
        isComplete={policyComplete}
        isLocked={!identityComplete}
        isActive={identityComplete && !policyComplete}
      >
        <div className="divide-y divide-border">
          {POLICY_TASKS.map((task) => (
            <div key={task.key} className="flex items-center gap-1">
              <div className="flex-1">
                <OnboardingTaskItem
                  label={task.label}
                  icon={task.icon}
                  done={!!tasks[task.key]}
                  disabled={isVerified}
                  onToggle={() => toggleTask(task.key)}
                />
              </div>
              {!tasks[task.key] && (task as any).navigateTo && !isVerified && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 shrink-0 text-primary"
                  onClick={() => navigate((task as any).navigateTo)}
                >
                  Go <ExternalLink className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </OnboardingStage>

      {/* Submit */}
      {status === "pending" && personalComplete && idUploaded && addressUploaded && policyComplete && (
        <Button variant="hero" onClick={handleSubmit} disabled={!allDone || submitting} className="gap-2">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Submit for Verification
        </Button>
      )}

      {isVerified && (
        <div className="ks-card p-4 bg-success/10 border-success/30">
          <p className="text-sm font-medium text-success">
            🎉 You're verified! You can now search for childminders and make bookings.
          </p>
        </div>
      )}
    </div>
  );
};

export default ParentOnboarding;
