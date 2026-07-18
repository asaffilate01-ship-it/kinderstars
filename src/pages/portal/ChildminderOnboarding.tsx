import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, FileText, Shield, Award, Heart, UserCheck,
  ClipboardList, Loader2, AlertTriangle, ExternalLink,
} from "lucide-react";
import OnboardingStage from "@/components/onboarding/OnboardingStage";
import OnboardingTaskItem from "@/components/onboarding/OnboardingTaskItem";
import InterviewBooking from "@/components/onboarding/InterviewBooking";
import AmiqusCheckButton from "@/components/AmiqusCheckButton";

const DOCUMENT_TASKS: Record<string, string> = {
  dbs_certificate: "dbs_certificate",
  first_aid: "first_aid_cert",
  insurance_details: "insurance",
  ofsted_details: "ofsted_registration",
  photo_uploaded: "profile_photo",
  references: "references",
  right_to_work: "right_to_work",
};

// Stage 1: Profile tasks — with navigation targets
const PROFILE_TASKS = [
  { key: "profile_complete", label: "Complete your profile (location, bio, hours, languages)", icon: UserCheck, requiresDoc: false, navigateTo: "/childminder/profile" },
  { key: "next_of_kin", label: "Add next of kin details", icon: UserCheck, requiresDoc: false, navigateTo: "/childminder/profile" },
  { key: "photo_uploaded", label: "Upload a profile photo", icon: UserCheck, requiresDoc: true },
];

// Stage 2: Document tasks
const DOC_TASKS = [
  { key: "dbs_certificate", label: "Upload DBS certificate", icon: Shield, requiresDoc: true },
  { key: "ofsted_details", label: "Upload Ofsted registration document", icon: Award, requiresDoc: true },
  { key: "insurance_details", label: "Upload insurance document", icon: FileText, requiresDoc: true },
  { key: "first_aid", label: "Upload First Aid certificate", icon: Heart, requiresDoc: true },
];

// Stage 3: References & right to work (now mandatory uploads)
const VERIFICATION_TASKS = [
  { key: "references", label: "Upload 2 professional references", icon: ClipboardList, requiresDoc: true },
  { key: "right_to_work", label: "Upload right to work document", icon: FileText, requiresDoc: true },
];

const ALL_TASKS = [...PROFILE_TASKS, ...DOC_TASKS, ...VERIFICATION_TASKS];

type OnboardingStatus = "pending" | "documents_submitted" | "interview_scheduled" | "interview_completed" | "verified" | "rejected";

const STATUS_LABELS: Record<OnboardingStatus, { label: string; color: string; description: string }> = {
  pending: { label: "Getting Started", color: "text-muted-foreground", description: "Complete all stages and submit for review." },
  documents_submitted: { label: "Documents Submitted — Under Review", color: "text-primary", description: "Your documents are being reviewed by the KinderStars team." },
  interview_scheduled: { label: "Interview Scheduled", color: "text-primary", description: "Your interview has been booked. Check Stage 4 for details." },
  interview_completed: { label: "Interview Completed — Awaiting Verification", color: "text-primary", description: "Your interview is complete. Final verification is in progress." },
  verified: { label: "✅ Verified — You can accept jobs!", color: "text-success", description: "Congratulations! Your account is fully verified." },
  rejected: { label: "Application Unsuccessful", color: "text-destructive", description: "Unfortunately your application was not successful. Please contact KinderStars for more information." },
};

const ChildminderOnboarding = () => {
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

    const { data: existingProfile } = await supabase
      .from("childminder_profiles")
      .select("onboarding_status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingProfile) {
      await supabase.from("childminder_profiles").insert({ user_id: user.id });
    }

    const [{ data: profile }, { data: taskRows }, { data: docs }] = await Promise.all([
      existingProfile
        ? Promise.resolve({ data: existingProfile })
        : supabase.from("childminder_profiles").select("onboarding_status").eq("user_id", user.id).maybeSingle(),
      supabase.from("onboarding_tasks").select("task_key, completed").eq("user_id", user.id),
      supabase.from("compliance_documents").select("document_type, status").eq("user_id", user.id),
    ]);

    setStatus((profile?.onboarding_status as OnboardingStatus) || "pending");

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
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, loadData]);

  // Realtime: listen for document status changes and onboarding status changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("onboarding-realtime-cm")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "compliance_documents", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const doc = payload.new as { document_type: string; status: string };
          // Find matching task key
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
        { event: "UPDATE", schema: "public", table: "childminder_profiles", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newStatus = (payload.new as { onboarding_status: string }).onboarding_status as OnboardingStatus;
          if (newStatus && newStatus !== status) {
            setStatus(newStatus);
            if (newStatus === "verified") {
              toast({ title: "🎉 You're verified!", description: "You can now accept shifts and start working." });
            } else if (newStatus === "interview_scheduled") {
              toast({ title: "Interview Scheduled", description: "Check your onboarding page for interview details." });
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, status]);

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

  // Stage completion checks
  const profileComplete = PROFILE_TASKS.every((t) => t.requiresDoc ? docStatuses[t.key] === "approved" : tasks[t.key]);
  const docsAllUploaded = DOC_TASKS.every((t) => !!docStatuses[t.key]);
  const docsAllApproved = DOC_TASKS.every((t) => docStatuses[t.key] === "approved");
  const docsAnyRejected = DOC_TASKS.some((t) => docStatuses[t.key] === "rejected");
  const verificationComplete = VERIFICATION_TASKS.every((t) => t.requiresDoc ? docStatuses[t.key] === "approved" : tasks[t.key]);
  const verificationAllUploaded = VERIFICATION_TASKS.every((t) => !!docStatuses[t.key]);
  const verificationAnyRejected = VERIFICATION_TASKS.some((t) => docStatuses[t.key] === "rejected");

  const interviewUnlocked = docsAllApproved && verificationComplete;
  const interviewDone = ["interview_completed", "verified"].includes(status);

  const completedCount = ALL_TASKS.filter((t) => tasks[t.key]).length;
  const totalSteps = ALL_TASKS.length + 1;
  const stepsComplete = completedCount + (interviewDone ? 1 : 0);
  const progress = Math.round((stepsComplete / totalSteps) * 100);

  const handleSubmitDocuments = async () => {
    if (!user || !docsAllUploaded || !profileComplete || !verificationComplete) return;
    setSubmitting(true);
    await supabase
      .from("childminder_profiles")
      .update({ onboarding_status: "documents_submitted" })
      .eq("user_id", user.id);
    setStatus("documents_submitted");
    setSubmitting(false);
    toast({ title: "Documents submitted! 📋", description: "We'll review your application and get back to you." });
  };

  if (loading) return <div className="text-muted-foreground p-4">Loading onboarding…</div>;

  const isVerified = status === "verified";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Onboarding</h1>
        <p className="text-muted-foreground text-sm">Complete all stages below to start accepting jobs.</p>
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

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{stepsComplete} of {totalSteps} steps</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stage 1: Profile */}
      <OnboardingStage
        title="Profile & Personal Details"
        description={profileComplete ? "All personal details completed" : "Complete your profile, upload a photo, and add next of kin"}
        stageNumber={1}
        isComplete={profileComplete}
        isLocked={false}
        isActive={!profileComplete}
      >
        <div className="divide-y divide-border">
          {PROFILE_TASKS.map((task) => (
            <div key={task.key} className="flex items-center gap-1">
              <div className="flex-1">
                {task.requiresDoc ? (
                  <OnboardingTaskItem
                    label={task.label}
                    icon={task.icon}
                    done={docStatuses[task.key] === "approved"}
                    disabled={isVerified}
                    requiresDoc
                    docStatus={docStatuses[task.key] || null}
                    onUpload={() => navigate("/childminder/compliance")}
                  />
                ) : (
                  <OnboardingTaskItem
                    label={task.label}
                    icon={task.icon}
                    done={!!tasks[task.key]}
                    disabled={isVerified}
                    onToggle={() => toggleTask(task.key)}
                  />
                )}
              </div>
              {!tasks[task.key] && !task.requiresDoc && task.navigateTo && !isVerified && (
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

      {/* Stage 2: Documents */}
      <OnboardingStage
        title="Compliance Documents"
        description={docsAllApproved ? "All documents approved ✅" : docsAnyRejected ? "⚠️ Some documents need re-uploading" : "Upload DBS, Ofsted, Insurance, and First Aid certificates"}
        stageNumber={2}
        isComplete={docsAllApproved}
        isLocked={!profileComplete}
        isActive={profileComplete && !docsAllApproved}
      >
        <div className="divide-y divide-border">
          {DOC_TASKS.map((task) => (
            <OnboardingTaskItem
              key={task.key}
              label={task.label}
              icon={task.icon}
              done={docStatuses[task.key] === "approved"}
              disabled={isVerified}
              requiresDoc
              docStatus={docStatuses[task.key] || null}
              onUpload={() => navigate("/childminder/compliance")}
            />
          ))}
        </div>

        {/* Amiqus automated checks */}
        {user && profileComplete && !isVerified && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border space-y-3">
            <p className="text-xs font-semibold text-foreground">🔒 Automated Verification via Amiqus</p>
            <p className="text-[11px] text-muted-foreground">Start your DBS check and ID verification digitally — no paper forms needed.</p>
            <div className="flex flex-wrap gap-2">
              <AmiqusCheckButton
                checkType="dbs"
                firstName={user.user_metadata?.first_name || ""}
                lastName={user.user_metadata?.last_name || ""}
                email={user.email || ""}
                existingStatus={docStatuses["dbs_certificate"]}
              />
              <AmiqusCheckButton
                checkType="identity"
                firstName={user.user_metadata?.first_name || ""}
                lastName={user.user_metadata?.last_name || ""}
                email={user.email || ""}
                existingStatus={docStatuses["photo_uploaded"]}
                label="Start ID Verification"
              />
            </div>
          </div>
        )}

        {docsAllUploaded && !docsAllApproved && !docsAnyRejected && (
          <p className="text-xs text-muted-foreground mt-3">
            ⏳ Your documents are being reviewed by KinderStars. You'll be notified in real-time once approved.
          </p>
        )}
        {docsAnyRejected && (
          <p className="text-xs text-destructive mt-3 font-medium">
            ⚠️ One or more documents were rejected. Please re-upload the rejected documents via the Compliance page.
          </p>
        )}
      </OnboardingStage>

      {/* Stage 3: References & Right to Work */}
      <OnboardingStage
        title="References & Right to Work"
        description={verificationComplete ? "References and eligibility confirmed" : "Provide references and confirm your eligibility to work"}
        stageNumber={3}
        isComplete={verificationComplete}
        isLocked={!docsAllUploaded}
        isActive={docsAllUploaded && !verificationComplete}
      >
        <div className="divide-y divide-border">
          {VERIFICATION_TASKS.map((task) => (
            <OnboardingTaskItem
              key={task.key}
              label={task.label}
              icon={task.icon}
              done={docStatuses[task.key] === "approved"}
              disabled={isVerified}
              requiresDoc
              docStatus={docStatuses[task.key] || null}
              onUpload={() => navigate("/childminder/compliance")}
            />
          ))}
        </div>

        {/* Amiqus Right to Work check */}
        {user && !isVerified && (
          <div className="mt-3">
            <AmiqusCheckButton
              checkType="right_to_work"
              firstName={user.user_metadata?.first_name || ""}
              lastName={user.user_metadata?.last_name || ""}
              email={user.email || ""}
              existingStatus={docStatuses["right_to_work"]}
            />
          </div>
        )}

        {verificationAllUploaded && !verificationComplete && !verificationAnyRejected && (
          <p className="text-xs text-muted-foreground mt-3">
            ⏳ Your documents are being reviewed by KinderStars. You'll be notified in real-time once approved.
          </p>
        )}
        {verificationAnyRejected && (
          <p className="text-xs text-destructive mt-3 font-medium">
            ⚠️ One or more documents were rejected. Please re-upload via the Compliance page.
          </p>
        )}
      </OnboardingStage>

      {/* Stage 4: Interview */}
      <OnboardingStage
        title="Onboarding Interview"
        description={interviewDone ? "Interview completed ✅" : "Book and attend your video interview via Google Meet"}
        stageNumber={4}
        isComplete={interviewDone}
        isLocked={!interviewUnlocked}
        isActive={interviewUnlocked && !interviewDone}
      >
        {user && (
          <InterviewBooking
            userId={user.id}
            roleTarget="childminder"
            disabled={isVerified}
          />
        )}
      </OnboardingStage>

      {/* Submit button */}
      {status === "pending" && docsAllUploaded && profileComplete && verificationComplete && (
        <Button
          variant="hero"
          onClick={handleSubmitDocuments}
          disabled={submitting}
          className="gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Submit for Review
        </Button>
      )}

      {isVerified && (
        <div className="ks-card p-4 bg-success/10 border-success/30">
          <p className="text-sm font-medium text-success">
            🎉 You're verified! You can now accept shifts and start working.
          </p>
        </div>
      )}
    </div>
  );
};

export default ChildminderOnboarding;
