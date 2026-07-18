import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CreditCard, Lock } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";

interface SubscriptionGateProps {
  children: React.ReactNode;
}

/**
 * Wraps portal content that requires an active subscription or valid free trial.
 * Shows an upgrade prompt if the trial has expired and no paid subscription exists.
 */
const SubscriptionGate = ({ children }: SubscriptionGateProps) => {
  const navigate = useNavigate();
  const { canWork, loading, trialActive, subscribed } = useSubscription();

  if (loading) return null;
  if (canWork) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center gap-6">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <Lock className="w-7 h-7 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Abonnement erforderlich</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Ihre kostenlose Testphase ist beendet. Wählen Sie ein Abonnement, um weiterhin
          Anfragen anzunehmen, Stundennachweise einzureichen und alle Portal-Funktionen zu nutzen.
        </p>
      </div>
      <Button
        variant="hero"
        className="gap-2"
        onClick={() => navigate("/childminder/subscription")}
      >
        <CreditCard className="w-4 h-4" />
        Abo-Pakete ansehen
      </Button>
    </div>
  );
};

export default SubscriptionGate;
