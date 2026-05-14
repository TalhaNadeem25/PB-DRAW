import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash, Gear, Trophy, CircleNotch, Users, Envelope, CheckCircle, CaretRight } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { waitlistAPI, eventAPI } from "@/services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { GameType, TournamentFormat } from "@/types/tournament";
import { SKILL_LEVEL_RANGES, formatEventSkillLevel } from "@/types/tournament";
import { Eyebrow, Pill, PbBtn } from "@/components/ui/pb";

const gameTypes: GameType[] = ["Singles", "Doubles", "Mixed Doubles"];
const tournamentFormats: TournamentFormat[] = [
  "Round Robin", "Single Elimination", "Double Elimination", "Pools + Playoffs",
];

function playFormatToDisplay(pf: string | undefined): TournamentFormat {
  const map: Record<string, TournamentFormat> = {
    "round-robin": "Round Robin", "single-elimination": "Single Elimination",
    "double-elimination": "Double Elimination", "pool-play": "Pools + Playoffs",
    "pool+knockout": "Pools + Playoffs", swiss: "Round Robin",
  };
  return pf ? (map[pf.toLowerCase()] ?? "Round Robin") : "Round Robin";
}
function displayToPlayFormat(f: TournamentFormat): string {
  const map: Record<string, string> = {
    "Round Robin": "round-robin", "Single Elimination": "single-elimination",
    "Double Elimination": "double-elimination", "Pools + Playoffs": "pool-play",
  };
  return map[f] ?? "round-robin";
}
function formatToGameType(f: string | undefined): GameType {
  if (!f) return "Singles";
  if (f.toLowerCase() === "doubles") return "Doubles";
  if (f.toLowerCase() === "mixed-doubles") return "Mixed Doubles";
  return "Singles";
}
function gameTypeToFormat(gt: GameType): string {
  return gt.toLowerCase().replace(" ", "-");
}

// ─── Shared form field ────────────────────────────────────────────────────────

function FormField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="text-[11px] font-mono uppercase tracking-[0.1em] text-pb-muted block mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] font-mono text-pb-faint mt-1">{hint}</p>}
    </div>
  );
}

function PbSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-9 px-2.5 text-[12px] font-mono bg-pb-surface2 border border-pb-hairline rounded-[6px] text-pb-ink focus:outline-none focus:border-pb-rule transition-colors"
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ─── Waitlist dialog content ──────────────────────────────────────────────────

function WaitlistDialogContent({ eventId, queryClient }: { eventId: string; queryClient: ReturnType<typeof useQueryClient> }) {
  const { data, isLoading } = useQuery({
    queryKey: ["waitlist", eventId],
    queryFn: () => waitlistAPI.getEventWaitlist(eventId),
    enabled: !!eventId,
  });
  const approveMutation = useMutation({
    mutationFn: (waitlistId: string) => waitlistAPI.approveEntry(eventId, waitlistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitlist", eventId] });
      queryClient.invalidateQueries({ queryKey: ["tournament"] });
      toast.success("Approved — email sent with payment link");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to approve"),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-8">
      <CircleNotch size={20} className="animate-spin text-pb-muted" />
    </div>
  );

  const entries = data?.data ?? [];
  if (entries.length === 0) return (
    <p className="text-[12px] font-mono text-pb-muted py-4">No one on the waitlist for this event.</p>
  );

  return (
    <div className="space-y-2 py-2">
      {entries.map((entry: any) => (
        <div key={entry._id} className="flex items-center justify-between gap-3 rounded-[6px] border border-pb-hairline p-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-[11px] text-pb-faint shrink-0">#{entry.position}</span>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-pb-ink truncate">{entry.user?.name ?? "—"}</p>
              <p className="flex items-center gap-1 text-[11px] font-mono text-pb-muted truncate">
                <Envelope size={10} /> {entry.user?.email ?? "—"}
              </p>
            </div>
          </div>
          <div className="shrink-0">
            {entry.status === "waiting" ? (
              <PbBtn size="sm" variant="primary" onClick={() => approveMutation.mutate(entry._id)} disabled={approveMutation.isPending}>
                {approveMutation.isPending
                  ? <CircleNotch size={12} className="animate-spin" />
                  : <><CheckCircle size={12} /> Approve</>}
              </PbBtn>
            ) : (
              <Pill tone="neutral" mono className="capitalize">{entry.status}</Pill>
            )}
          </div>
        </div>
      ))}
      <p className="text-[11px] font-mono text-pb-faint mt-2">
        Approving sends a payment link. They have 24 hours to complete registration.
      </p>
    </div>
  );
}

// ─── Event form (shared between create + edit) ────────────────────────────────

function EventForm({ form, onChange, isNew = false }: {
  form: { name: string; gameType: GameType; format: TournamentFormat; skillLevel: string; maxPlayers: number; entryFee: number };
  onChange: (f: any) => void;
  isNew?: boolean;
}) {
  return (
    <div className="space-y-4">
      <FormField label="Event Name *">
        <Input
          placeholder="e.g. Men's Singles"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          className="h-9 text-[13px] bg-pb-surface2 border-pb-hairline font-sans focus:border-pb-rule"
        />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Game Type">
          <PbSelect
            value={form.gameType}
            onChange={(v) => onChange({ ...form, gameType: v as GameType })}
            options={gameTypes.map((gt) => ({ value: gt, label: gt }))}
          />
        </FormField>
        <FormField label="Format">
          <PbSelect
            value={form.format}
            onChange={(v) => onChange({ ...form, format: v as TournamentFormat })}
            options={tournamentFormats.map((tf) => ({ value: tf, label: tf }))}
          />
        </FormField>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Skill Level">
          <PbSelect
            value={form.skillLevel}
            onChange={(v) => onChange({ ...form, skillLevel: v })}
            options={SKILL_LEVEL_RANGES.map((r) => ({ value: r, label: r }))}
          />
        </FormField>
        <FormField
          label={form.gameType === "Singles" ? "Max Players" : "Max Teams"}
          hint={form.gameType === "Singles" ? "Players" : "Pairs"}
        >
          <Input
            type="number" min={2}
            value={form.maxPlayers}
            onChange={(e) => onChange({ ...form, maxPlayers: parseInt(e.target.value) || 16 })}
            className="h-9 text-[13px] font-mono bg-pb-surface2 border-pb-hairline focus:border-pb-rule"
          />
        </FormField>
        <FormField label="Entry Fee ($)">
          <Input
            type="number"
            value={form.entryFee}
            onChange={(e) => onChange({ ...form, entryFee: parseInt(e.target.value) || 0 })}
            className="h-9 text-[13px] font-mono bg-pb-surface2 border-pb-hairline focus:border-pb-rule"
          />
        </FormField>
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface OrganizerEventsPanelProps {
  tournamentId: string;
  tournament: any;
  events: any[];
  isCreateEventOpen: boolean;
  setIsCreateEventOpen: (open: boolean) => void;
  newEvent: { name: string; gameType: GameType; format: TournamentFormat; skillLevel: string; maxPlayers: number; entryFee: number };
  setNewEvent: (e: any) => void;
  onCreateEvent: () => void;
  createEventPending: boolean;
  onDeleteEvent: (eventId: string, eventName: string) => void;
}

const OrganizerEventsPanel = ({
  tournamentId, tournament, events,
  isCreateEventOpen, setIsCreateEventOpen,
  newEvent, setNewEvent, onCreateEvent, createEventPending,
  onDeleteEvent,
}: OrganizerEventsPanelProps) => {
  const queryClient = useQueryClient();
  const allowWaitlist = tournament?.settings?.allowWaitlist === true;
  const [waitlistEvent, setWaitlistEvent] = useState<{ _id: string; name: string } | null>(null);
  const [eventToEdit, setEventToEdit] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: "", gameType: "Singles" as GameType, format: "Round Robin" as TournamentFormat,
    skillLevel: "3.5-4.0", maxPlayers: 32, entryFee: 50, addPlayoffStage: false,
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: any }) => eventAPI.update(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      setEventToEdit(null);
      toast.success("Event updated");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update event"),
  });

  const openEditEvent = (event: any) => {
    setEventToEdit(event);
    setEditForm({
      name: event.name ?? "",
      gameType: formatToGameType(event.format),
      format: playFormatToDisplay(event.playFormat),
      skillLevel: event.skillLevel ?? "3.5-4.0",
      maxPlayers: event.maxTeams ?? (event.format === "singles" ? 32 : 16),
      entryFee: event.entryFee ?? 0,
      addPlayoffStage: !!event.addPlayoffStage,
    });
  };

  const handleSaveEventSettings = () => {
    if (!eventToEdit?._id) return;
    if (!editForm.name?.trim()) { toast.error("Event name is required"); return; }
    updateEventMutation.mutate({
      eventId: eventToEdit._id,
      data: {
        name: editForm.name.trim(),
        format: gameTypeToFormat(editForm.gameType),
        playFormat: displayToPlayFormat(editForm.format),
        addPlayoffStage: displayToPlayFormat(editForm.format) !== "round-robin",
        skillLevel: editForm.skillLevel,
        maxTeams: editForm.maxPlayers,
        entryFee: editForm.entryFee,
      },
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-[20px] tracking-[-0.025em] text-pb-ink">Events</h2>
        <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
          <DialogTrigger asChild>
            <PbBtn variant="primary" size="sm">
              <Plus size={13} /> Add Event
            </PbBtn>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-pb-surface border border-pb-hairline rounded-[8px] p-0">
            <DialogHeader className="px-5 pt-5 pb-4 border-b border-pb-hairline">
              <DialogTitle className="font-display font-bold text-[17px] tracking-[-0.025em] text-pb-ink">
                Create New Event
              </DialogTitle>
              <DialogDescription className="text-[12px] font-mono text-pb-muted mt-0.5">
                Add a new event to this tournament
              </DialogDescription>
            </DialogHeader>
            <div className="px-5 py-4">
              <EventForm form={newEvent} onChange={setNewEvent} isNew />
            </div>
            <DialogFooter className="px-5 pb-5 flex gap-2">
              <PbBtn variant="outline" size="sm" onClick={() => setIsCreateEventOpen(false)}>Cancel</PbBtn>
              <PbBtn variant="primary" size="sm" onClick={onCreateEvent} disabled={createEventPending}>
                {createEventPending ? <><CircleNotch size={12} className="animate-spin" /> Creating…</> : <><Plus size={12} /> Create Event</>}
              </PbBtn>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Event list */}
      {events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event: any) => {
            const isSingles = (event.format || "").toLowerCase() === "singles";
            return (
              <div key={event._id} className="bg-pb-surface border border-pb-hairline rounded-[6px] p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-[16px] tracking-[-0.02em] text-pb-ink">
                      {event.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <Pill tone="neutral" mono className="capitalize">
                        {(event.format || "").replace("-", " ")}
                      </Pill>
                      <Pill tone="neutral" mono>{formatEventSkillLevel(event.skillLevel)}</Pill>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <Eyebrow>{isSingles ? "Players" : "Teams"}</Eyebrow>
                      <p className="font-mono text-[15px] font-medium text-pb-ink mt-0.5">
                        {event.currentTeams || 0}/{event.maxTeams}
                      </p>
                    </div>
                    <div className="text-right">
                      <Eyebrow>Entry</Eyebrow>
                      <p className="font-mono text-[15px] font-medium text-pb-court mt-0.5">
                        ${event.entryFee}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-pb-hairline">
                  {allowWaitlist && (
                    <PbBtn variant="outline" size="sm" onClick={() => setWaitlistEvent({ _id: event._id, name: event.name })}>
                      <Users size={12} /> Waitlist
                    </PbBtn>
                  )}
                  <PbBtn variant="outline" size="sm" onClick={() => openEditEvent(event)}>
                    <Gear size={12} /> Settings
                  </PbBtn>
                  <PbBtn variant="outline" size="sm" asChild>
                    <Link to={`/tournaments/${tournamentId}/events/${event._id}/pools`}>
                      Pools <CaretRight size={12} />
                    </Link>
                  </PbBtn>
                  <button
                    onClick={() => onDeleteEvent(event._id, event.name)}
                    className="ml-auto h-8 w-8 rounded-[6px] border border-pb-hairline flex items-center justify-center text-pb-faint hover:border-destructive/50 hover:text-destructive transition-colors"
                    title="Delete event"
                  >
                    <Trash size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-pb-surface border border-pb-hairline rounded-[6px]">
          <Trophy size={24} className="text-pb-faint" />
          <p className="text-[12px] font-mono text-pb-muted">No events yet. Add your first event above.</p>
        </div>
      )}

      {/* Waitlist dialog */}
      <Dialog open={!!waitlistEvent} onOpenChange={(open) => !open && setWaitlistEvent(null)}>
        <DialogContent className="max-w-lg bg-pb-surface border border-pb-hairline rounded-[8px] p-0 max-h-[80vh] overflow-y-auto">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-pb-hairline">
            <DialogTitle className="font-display font-bold text-[17px] tracking-[-0.025em] text-pb-ink">
              Waitlist — {waitlistEvent?.name ?? ""}
            </DialogTitle>
            <DialogDescription className="text-[12px] font-mono text-pb-muted mt-0.5">
              Approve to send a payment link. They have 24 hours to register.
            </DialogDescription>
          </DialogHeader>
          <div className="px-5 py-4">
            {waitlistEvent && <WaitlistDialogContent eventId={waitlistEvent._id} queryClient={queryClient} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit event dialog */}
      <Dialog open={!!eventToEdit} onOpenChange={(open) => !open && setEventToEdit(null)}>
        <DialogContent className="max-w-lg bg-pb-surface border border-pb-hairline rounded-[8px] p-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-pb-hairline">
            <DialogTitle className="font-display font-bold text-[17px] tracking-[-0.025em] text-pb-ink">
              Event Settings
            </DialogTitle>
            <DialogDescription className="text-[12px] font-mono text-pb-muted mt-0.5">
              Update name, format, capacity, and entry fee.
            </DialogDescription>
          </DialogHeader>
          {eventToEdit && (
            <div className="px-5 py-4">
              <EventForm form={editForm} onChange={setEditForm} />
            </div>
          )}
          <DialogFooter className="px-5 pb-5 flex gap-2">
            <PbBtn variant="outline" size="sm" onClick={() => setEventToEdit(null)}>Cancel</PbBtn>
            <PbBtn variant="primary" size="sm" onClick={handleSaveEventSettings} disabled={updateEventMutation.isPending}>
              {updateEventMutation.isPending ? <><CircleNotch size={12} className="animate-spin" /> Saving…</> : "Save changes"}
            </PbBtn>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizerEventsPanel;
