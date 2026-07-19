import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Clock, AlertTriangle, TrendingUp, Calendar, Award } from "lucide-react";

interface Stats {
  totalShifts: number;
  completedShifts: number;
  totalHours: number;
  lateArrivals: number;
  avgHoursPerShift: number;
  reliabilityScore: number;
  submittedTimesheets: number;
  approvedTimesheets: number;
}

const PerformanceDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: shifts }, { data: timesheets }] = await Promise.all([
      supabase.from("shifts").select("*").eq("childminder_id", user.id),
      supabase.from("timesheets").select("*").eq("childminder_id", user.id),
    ]);

    const allShifts = shifts || [];
    const allTimesheets = timesheets || [];

    const completedShifts = allShifts.filter((s) => s.status === "completed").length;
    const totalHours = allTimesheets.reduce((sum, t) => sum + (Number(t.total_hours) || 0), 0);
    const lateArrivals = allTimesheets.filter((t) => t.notes?.includes("⚠️ Late arrival")).length;
    const submittedTimesheets = allTimesheets.filter((t) => t.status !== "draft").length;
    const approvedTimesheets = allTimesheets.filter((t) => t.status === "approved").length;
    const avgHoursPerShift = submittedTimesheets > 0 ? totalHours / submittedTimesheets : 0;

    // Reliability = (on-time arrivals / total timesheets) * 100, weighted by completion rate
    const onTime = submittedTimesheets - lateArrivals;
    const reliabilityScore = submittedTimesheets > 0
      ? Math.round((onTime / submittedTimesheets) * 100)
      : 100;

    setStats({
      totalShifts: allShifts.length,
      completedShifts,
      totalHours: Math.round(totalHours * 10) / 10,
      lateArrivals,
      avgHoursPerShift: Math.round(avgHoursPerShift * 10) / 10,
      reliabilityScore,
      submittedTimesheets,
      approvedTimesheets,
    });
    setLoading(false);
  };

  if (loading) return <div className="text-muted-foreground p-4">Wird geladen…</div>;
  if (!stats) return null;

  const cards = [
    { label: "Zuverlässigkeitsscore", value: `${stats.reliabilityScore}%`, icon: Award, color: stats.reliabilityScore >= 90 ? "text-success" : stats.reliabilityScore >= 70 ? "text-primary" : "text-destructive" },
    { label: "Geleistete Stunden", value: `${stats.totalHours} Std.`, icon: Clock, color: "text-secondary" },
    { label: "Abgeschlossene Einsätze", value: `${stats.completedShifts}`, icon: Calendar, color: "text-secondary" },
    { label: "Verspätungen", value: `${stats.lateArrivals}`, icon: AlertTriangle, color: stats.lateArrivals === 0 ? "text-success" : "text-destructive" },
    { label: "Ø Stunden/Einsatz", value: `${stats.avgHoursPerShift} Std.`, icon: TrendingUp, color: "text-secondary" },
    { label: "Genehmigte Stundenzettel", value: `${stats.approvedTimesheets}/${stats.submittedTimesheets}`, icon: TrendingUp, color: "text-secondary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leistung</h1>
        <p className="text-muted-foreground text-sm">Deine Anwesenheits- und Zuverlässigkeitsstatistiken.</p>
      </div>

      {/* Reliability hero */}
      <div className="ks-card p-6 text-center">
        <div className="relative inline-flex items-center justify-center w-28 h-28 mb-3">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke={stats.reliabilityScore >= 90 ? "hsl(var(--success))" : stats.reliabilityScore >= 70 ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${stats.reliabilityScore * 2.64} 264`}
            />
          </svg>
          <span className="absolute text-2xl font-bold">{stats.reliabilityScore}%</span>
        </div>
        <p className="font-bold text-sm">Zuverlässigkeitsscore</p>
        <p className="text-xs text-muted-foreground mt-1">Basierend auf pünktlichen Ankünften über {stats.submittedTimesheets} erfasste Einsätze</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.slice(1).map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="ks-card p-4">
              <Icon className={`w-5 h-5 ${card.color} mb-2`} />
              <p className="text-xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Late arrival details */}
      {stats.lateArrivals > 0 && (
        <div className="ks-card p-4 bg-destructive/5 border-destructive/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <p className="font-bold text-sm text-destructive">Verspätungshinweis</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Es sind {stats.lateArrivals} Verspätung{stats.lateArrivals !== 1 ? "en" : ""} erfasst.
            Pünktlichkeit verbessert deinen Zuverlässigkeitsscore und erhöht die Zahl der Einsatzangebote.
          </p>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;
