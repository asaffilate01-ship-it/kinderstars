import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  CalendarDays, Video, Clock, CheckCircle2, Loader2, ExternalLink,
} from "lucide-react";

interface InterviewBookingProps {
  userId: string;
  roleTarget: "childminder" | "parent";
  disabled?: boolean;
}

interface Slot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  meeting_link: string | null;
  status: string;
  booked_by: string | null;
}

const InterviewBooking = ({ userId, roleTarget, disabled }: InterviewBookingProps) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookedSlot, setBookedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<string | null>(null);

  useEffect(() => {
    loadSlots();
  }, [userId]);

  const loadSlots = async () => {
    setLoading(true);

    // Fetch user's booked slot
    const { data: userSlot } = await supabase
      .from("interview_slots")
      .select("*")
      .eq("booked_by", userId)
      .in("status", ["booked", "completed"])
      .maybeSingle();

    if (userSlot) {
      setBookedSlot(userSlot as Slot);
      setSlots([]);
      setLoading(false);
      return;
    }

    // Fetch available slots
    const { data: available } = await supabase
      .from("interview_slots")
      .select("*")
      .eq("status", "available")
      .eq("role_target", roleTarget)
      .gte("slot_date", new Date().toISOString().split("T")[0])
      .order("slot_date", { ascending: true })
      .order("start_time", { ascending: true });

    setSlots((available as Slot[]) || []);
    setLoading(false);
  };

  const bookSlot = async (slotId: string) => {
    setBooking(slotId);

    const { error } = await supabase
      .from("interview_slots")
      .update({
        booked_by: userId,
        booked_at: new Date().toISOString(),
        status: "booked",
      })
      .eq("id", slotId)
      .eq("status", "available");

    if (error) {
      toast({ title: "Booking failed", description: "This slot may have been taken. Please try another.", variant: "destructive" });
      await loadSlots();
    } else {
      toast({ title: "Interview booked!", description: "You'll receive further details shortly." });

      // Send email notification to admin about the booking
      supabase.functions.invoke("send-contact-email", {
        body: {
          name: "Interview System",
          email: "system@kinderstars.de",
          message: `INTERVIEW BOOKED\n\nUser ID: ${userId}\nRole: ${roleTarget}\nSlot: ${slots.find(s => s.id === slotId)?.slot_date} ${slots.find(s => s.id === slotId)?.start_time}\n\nPlease check the admin dashboard.`,
        },
      }).catch(() => {});

      await loadSlots();
    }

    setBooking(null);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading interview slots…
      </div>
    );
  }

  // Already booked
  if (bookedSlot) {
    const isCompleted = bookedSlot.status === "completed";
    return (
      <div className="space-y-3">
        <div className={`rounded-lg p-4 ${isCompleted ? "bg-success/10 border border-success/30" : "bg-primary/5 border border-primary/20"}`}>
          <div className="flex items-center gap-2 mb-2">
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <Video className="w-5 h-5 text-primary" />
            )}
            <span className="font-bold text-sm">
              {isCompleted ? "Interview Completed ✅" : "Interview Booked"}
            </span>
          </div>
          <div className="text-sm space-y-1 text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5" />
              {format(new Date(bookedSlot.slot_date), "EEEE, d MMMM yyyy")}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              {bookedSlot.start_time.slice(0, 5)} – {bookedSlot.end_time.slice(0, 5)}
            </div>
          </div>

          {bookedSlot.meeting_link && !isCompleted && (
            <a
              href={bookedSlot.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-primary hover:underline"
            >
              <Video className="w-4 h-4" />
              Join Google Meet
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  // No slots available
  if (slots.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        <p>No interview slots are currently available. The KinderStars team will publish slots soon — check back later, or an admin may schedule your interview directly.</p>
      </div>
    );
  }

  // Available slots to book
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Choose an available interview slot below. Interviews are conducted via Google Meet video call.
      </p>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors"
          >
            <div className="text-sm">
              <div className="font-medium">
                {format(new Date(slot.slot_date), "EEE, d MMM yyyy")}
              </div>
              <div className="text-muted-foreground text-xs">
                {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
              </div>
            </div>
            <Button
              size="sm"
              variant="default"
              disabled={disabled || booking === slot.id}
              onClick={() => bookSlot(slot.id)}
              className="gap-1.5 text-xs"
            >
              {booking === slot.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CalendarDays className="w-3.5 h-3.5" />
              )}
              Book
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterviewBooking;
