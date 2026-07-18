import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatEUR, FIRST_AID } from "@/lib/pricing";
import { CalendarDays, MapPin, Users, ShieldCheck, Loader2 } from "lucide-react";

interface Session {
  id: string;
  session_date: string;
  trainer_name: string;
  venue_name: string;
  venue_address: string;
  city: string;
  postal_code: string;
  capacity: number;
  seats_booked: number;
  seat_price_cents: number;
  status: string;
  notes: string | null;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ErsteHilfe() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("first_aid_sessions")
      .select("*")
      .in("status", ["scheduled", "full"])
      .order("session_date", { ascending: true });
    if (error) toast.error("Kurse konnten nicht geladen werden");
    setSessions((data ?? []) as Session[]);
    setLoading(false);
  };

  const reserve = async (s: Session) => {
    if (!user) {
      toast.info("Bitte einloggen, um einen Platz zu reservieren.");
      return;
    }
    if (s.seats_booked >= s.capacity) {
      toast.error("Dieser Kurs ist ausgebucht.");
      return;
    }
    setBookingId(s.id);
    const refresher = new Date();
    refresher.setMonth(refresher.getMonth() + FIRST_AID.refresherReminderMonths);
    const { error } = await supabase.from("first_aid_bookings").insert({
      session_id: s.id,
      user_id: user.id,
      seat_count: 1,
      amount_cents: s.seat_price_cents,
      status: "reserved",
      refresher_due_at: refresher.toISOString(),
    });
    setBookingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      "Platz reserviert. Zahlungsanweisungen folgen per E-Mail.",
    );
    await load();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-10">
          <Badge className="mb-3">Erste Hilfe am Kind</Badge>
          <h1 className="text-4xl font-bold mb-3">
            KinderStars Erste-Hilfe-Gruppenkurse
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            9-Unterrichtseinheiten-Kurs „Erste Hilfe am Kind" für
            Kindertagespflegepersonen, Nannies und Eltern. Kleingruppen,
            praxisorientiert, mit Teilnahmebescheinigung. Auffrischung
            alle 2 Jahre empfohlen — wir erinnern automatisch.
          </p>
        </div>

        <Card className="p-6 mb-8 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium">
                Preis pro Platz: {formatEUR(FIRST_AID.seatPriceCents)}
              </p>
              <p className="text-muted-foreground">
                Zahlung nach Reservierung. Teilnahmebescheinigung nach
                Kursende. Für Kindertagespflege in vielen Bundesländern
                anerkannt — bitte lokale Vorgaben mit dem Jugendamt
                prüfen.
              </p>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Aktuell sind keine Kurse geplant. Bitte in Kürze erneut
            schauen.
          </Card>
        ) : (
          <div className="grid gap-4">
            {sessions.map((s) => {
              const free = s.capacity - s.seats_booked;
              const full = free <= 0;
              return (
                <Card key={s.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="w-4 h-4" />
                        {fmtDate(s.session_date)}
                      </div>
                      <h3 className="text-lg font-semibold">
                        {s.venue_name} — {s.city}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {s.venue_address}, {s.postal_code} {s.city}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {free} von {s.capacity} Plätzen frei
                        </span>
                        <span className="text-muted-foreground">
                          Trainer:in: {s.trainer_name}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-2xl font-bold">
                        {formatEUR(s.seat_price_cents)}
                      </div>
                      <Button
                        onClick={() => reserve(s)}
                        disabled={full || bookingId === s.id}
                      >
                        {bookingId === s.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : full ? (
                          "Ausgebucht"
                        ) : user ? (
                          "Platz reservieren"
                        ) : (
                          "Anmelden zum Reservieren"
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {!user && (
          <p className="text-sm text-muted-foreground mt-8 text-center">
            Noch kein Konto?{" "}
            <Link to="/auth" className="text-primary underline">
              Jetzt registrieren
            </Link>{" "}
            und Platz sichern.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}