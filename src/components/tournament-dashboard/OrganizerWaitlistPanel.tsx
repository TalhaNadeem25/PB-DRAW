import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { waitlistAPI } from "@/services/api";
import { CheckCircle, ListNumbers, CircleNotch, Envelope } from "@phosphor-icons/react";
import { useState } from "react";
import { Eyebrow, Pill, PbBtn } from "@/components/ui/pb";

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
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-extrabold text-[28px] tracking-[-0.03em] text-pb-ink leading-none mb-1">
            Waitlist
          </h2>
          <p className="text-[13px] text-pb-muted font-mono">Manage overflow registrations</p>
        </div>
        <div className="bg-pb-surface border border-pb-hairline rounded-[6px] px-5 py-14 text-center">
          <ListNumbers size={28} className="mx-auto mb-3 text-pb-faint" />
          <p className="text-[13px] font-sans font-medium text-pb-ink mb-1">Waitlist is not enabled</p>
          <p className="text-[12px] font-mono text-pb-muted max-w-sm mx-auto">
            Enable the waitlist in tournament Settings so players can join when events are full.
            You can then approve them here to send a payment link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-[28px] tracking-[-0.03em] text-pb-ink leading-none mb-1">
            Waitlist
          </h2>
          <p className="text-[12px] font-mono text-pb-muted max-w-sm">
            Approving a player sends them an email to pay and complete registration.
          </p>
        </div>

        {/* Event picker */}
        <div className="shrink-0 w-full sm:w-56">
          <label className="block text-[11px] font-mono uppercase tracking-[0.08em] text-pb-muted mb-1.5">
            Event
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full h-9 rounded-[6px] border border-pb-hairline bg-pb-surface2 px-3 text-[13px] font-mono text-pb-ink focus:outline-none focus:border-pb-rule"
          >
            <option value="">Select an event…</option>
            {eventsWithWaitlist.map((event: any) => (
              <option key={event._id} value={event._id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Body */}
      {!selectedEventId ? (
        <div className="bg-pb-surface border border-pb-hairline rounded-[6px] px-5 py-14 text-center">
          <ListNumbers size={28} className="mx-auto mb-3 text-pb-faint" />
          <p className="text-[13px] font-sans font-medium text-pb-ink mb-1">Select an event</p>
          <p className="text-[12px] font-mono text-pb-muted">
            Choose an event above to see who is on the waitlist.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <CircleNotch size={24} className="animate-spin text-pb-muted" />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-pb-surface border border-pb-hairline rounded-[6px] px-5 py-14 text-center">
          <ListNumbers size={28} className="mx-auto mb-3 text-pb-faint" />
          <p className="text-[13px] font-sans font-medium text-pb-ink mb-1">No one on the waitlist</p>
          <p className="text-[12px] font-mono text-pb-muted max-w-sm mx-auto">
            When this event is full, players can join the waitlist. They will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-pb-surface border border-pb-hairline rounded-[6px] overflow-hidden divide-y divide-pb-hairline">
            {/* Table header */}
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-2.5 bg-pb-surface2">
              <Eyebrow>#</Eyebrow>
              <Eyebrow>Player</Eyebrow>
              <Eyebrow>Action</Eyebrow>
            </div>

            {entries.map((entry: any) => (
              <div
                key={entry._id}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-3.5 hover:bg-pb-surface2 transition-colors"
              >
                {/* Position */}
                <span className="font-mono text-[12px] text-pb-muted w-6 text-right shrink-0">
                  {entry.position}
                </span>

                {/* Player info */}
                <div className="min-w-0">
                  <p className="font-display font-semibold text-[14px] tracking-[-0.015em] text-pb-ink truncate">
                    {entry.user?.name ?? "—"}
                  </p>
                  <p className="flex items-center gap-1 text-[11px] font-mono text-pb-muted truncate mt-0.5">
                    <Envelope size={10} className="shrink-0" />
                    {entry.user?.email ?? "—"}
                  </p>
                </div>

                {/* Action */}
                <div className="shrink-0">
                  {entry.status === "waiting" ? (
                    <PbBtn
                      variant="primary"
                      size="sm"
                      onClick={() => approveMutation.mutate(entry._id)}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? (
                        <CircleNotch size={13} className="animate-spin" />
                      ) : (
                        <>
                          <CheckCircle size={13} />
                          Approve
                        </>
                      )}
                    </PbBtn>
                  ) : (
                    <Pill tone="neutral" mono className="capitalize">{entry.status}</Pill>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] font-mono text-pb-faint">
            Approving sends an email with a payment link. Players have 24 hours to complete registration.
          </p>
        </div>
      )}
    </div>
  );
}
