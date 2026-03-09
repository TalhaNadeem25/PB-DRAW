import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { waitlistAPI } from "@/services/api";
import { CheckCircle, ListNumbers, CircleNotch, Envelope } from "@phosphor-icons/react";
import { useState } from "react";

interface OrganizerWaitlistPanelProps {
  tournamentId: string;
  tournament: any;
  events: any[];
}

export default function OrganizerWaitlistPanel({
  tournamentId,
  tournament,
  events,
}: OrganizerWaitlistPanelProps) {
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  const allowWaitlist = tournament?.settings?.allowWaitlist === true;
  const eventsWithWaitlist = events?.length ? events : [];

  const { data, isLoading } = useQuery({
    queryKey: ["waitlist", selectedEventId],
    queryFn: () => waitlistAPI.getEventWaitlist(selectedEventId),
    enabled: !!selectedEventId,
  });

  const approveMutation = useMutation({
    mutationFn: (waitlistId: string) =>
      waitlistAPI.approveEntry(selectedEventId, waitlistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitlist", selectedEventId] });
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      toast.success("Approved", {
        description: "User has been emailed to pay and complete registration.",
      });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to approve");
    },
  });

  const entries = data?.data ?? [];

  if (!allowWaitlist) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <ListNumbers className="w-8 h-8 text-primary" />
          <h2 className="font-display font-bold text-2xl">Waitlist</h2>
        </div>
        <div className="glass-card rounded-2xl border border-border/50 p-12 text-center">
          <ListNumbers className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground font-medium">Waitlist is not enabled</p>
          <p className="text-sm text-muted-foreground mt-1">
            Enable the waitlist in tournament Settings so players can join when events are full. You can then approve them here to send a payment link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl flex items-center gap-2">
            <ListNumbers className="w-6 h-6 text-primary" />
            Waitlist
          </h2>
          <p className="text-muted-foreground mt-1">
            Select an event to view and approve players on the waitlist. Approving sends them an email to pay and complete registration.
          </p>
        </div>
        <div className="w-full sm:w-64 shrink-0">
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {eventsWithWaitlist.map((event: any) => (
                <SelectItem key={event._id} value={event._id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedEventId ? (
        <div className="glass-card rounded-2xl border border-border/50 p-12 text-center">
          <ListNumbers className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground font-medium">Select an event</p>
          <p className="text-sm text-muted-foreground mt-1">
            Choose an event from the dropdown above to see who is on the waitlist.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <CircleNotch className="w-10 h-10 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <div className="glass-card rounded-2xl border border-border/50 p-12 text-center">
          <ListNumbers className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground font-medium">No one on the waitlist</p>
          <p className="text-sm text-muted-foreground mt-1">
            When this event is full, players can join the waitlist. They will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/50">
            {entries.map((entry: any) => (
              <div
                key={entry._id}
                className="flex items-center justify-between gap-3 p-4 bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-sm text-muted-foreground shrink-0 w-8">
                    #{entry.position}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{entry.user?.name ?? "—"}</div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground truncate">
                      <Envelope className="w-3 h-3 shrink-0" />
                      {entry.user?.email ?? "—"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {entry.status === "waiting" ? (
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(entry._id)}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? (
                        <CircleNotch className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                  ) : (
                    <span className="text-xs font-medium px-2 py-1 rounded-md bg-muted text-muted-foreground capitalize">
                      {entry.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Approving sends an email with a payment link. They have 24 hours to complete registration.
          </p>
        </div>
      )}
    </div>
  );
}
