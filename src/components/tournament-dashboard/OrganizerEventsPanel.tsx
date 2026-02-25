import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Settings, Trophy, Loader2, Users, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { waitlistAPI, eventAPI } from "@/services/api";
import { toast } from "sonner";
import type { GameType, TournamentFormat } from "@/types/tournament";
import { SKILL_LEVEL_RANGES, formatEventSkillLevel } from "@/types/tournament";
const gameTypes: GameType[] = ["Singles", "Doubles", "Mixed Doubles"];
const tournamentFormats: TournamentFormat[] = [
  "Round Robin",
  "Single Elimination",
  "Double Elimination",
  "Pools + Playoffs",
];

/** Map API playFormat (kebab) to TournamentFormat (display) */
function playFormatToDisplay(playFormat: string | undefined): TournamentFormat {
  if (!playFormat) return "Round Robin";
  const map: Record<string, TournamentFormat> = {
    "round-robin": "Round Robin",
    "single-elimination": "Single Elimination",
    "double-elimination": "Double Elimination",
    "pool-play": "Pools + Playoffs",
    "pool+knockout": "Pools + Playoffs",
    swiss: "Round Robin",
  };
  return map[playFormat.toLowerCase()] ?? "Round Robin";
}

/** Map TournamentFormat (display) to API playFormat */
function displayToPlayFormat(format: TournamentFormat): string {
  const map: Record<string, string> = {
    "Round Robin": "round-robin",
    "Single Elimination": "single-elimination",
    "Double Elimination": "double-elimination",
    "Pools + Playoffs": "pool-play",
  };
  return map[format] ?? "round-robin";
}

/** Map API format (singles/doubles) to GameType */
function formatToGameType(format: string | undefined): GameType {
  if (!format) return "Singles";
  const f = format.toLowerCase();
  if (f === "doubles") return "Doubles";
  if (f === "mixed-doubles") return "Mixed Doubles";
  return "Singles";
}

/** Map GameType to API format */
function gameTypeToFormat(gt: GameType): string {
  return gt.toLowerCase().replace(" ", "-");
}

function WaitlistDialogContent({
  eventId,
  onClose,
  toast,
  queryClient,
}: {
  eventId: string;
  onClose: () => void;
  toast: any;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
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
      toast({ title: "Approved", description: "User has been emailed to pay and complete registration." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to approve", variant: "destructive" });
    },
  });
  const entries = data?.data ?? [];
  const waiting = entries.filter((e: any) => e.status === "waiting");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (entries.length === 0) {
    return <p className="text-muted-foreground py-4">No one on the waitlist for this event.</p>;
  }
  return (
    <div className="space-y-3 py-2">
      {entries.map((entry: any) => (
        <div key={entry._id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-sm text-muted-foreground shrink-0">#{entry.position}</span>
            <div className="min-w-0">
              <div className="font-medium truncate">{entry.user?.name ?? "—"}</div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground truncate">
                <Mail className="w-3 h-3 shrink-0" />
                {entry.user?.email ?? "—"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {entry.status === "waiting" && (
              <Button
                size="sm"
                onClick={() => approveMutation.mutate(entry._id)}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                Approve
              </Button>
            )}
            {entry.status !== "waiting" && (
              <Badge variant="secondary" className="capitalize">{entry.status}</Badge>
            )}
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground mt-2">
        Approving sends an email with a payment link. They have 24 hours to complete registration.
      </p>
    </div>
  );
}

interface OrganizerEventsPanelProps {
  tournamentId: string;
  tournament: any;
  events: any[];
  isCreateEventOpen: boolean;
  setIsCreateEventOpen: (open: boolean) => void;
  newEvent: {
    name: string;
    gameType: GameType;
    format: TournamentFormat;
    skillLevel: string;
    maxPlayers: number;
    entryFee: number;
  };
  setNewEvent: (event: any) => void;
  onCreateEvent: () => void;
  createEventPending: boolean;
  onDeleteEvent: (eventId: string, eventName: string) => void;
}

const OrganizerEventsPanel = ({
  tournamentId,
  tournament,
  events,
  isCreateEventOpen,
  setIsCreateEventOpen,
  newEvent,
  setNewEvent,
  onCreateEvent,
  createEventPending,
  onDeleteEvent,
}: OrganizerEventsPanelProps) => {
  const queryClient = useQueryClient();
  const allowWaitlist = tournament?.settings?.allowWaitlist === true;
  const [waitlistEvent, setWaitlistEvent] = useState<{ _id: string; name: string } | null>(null);
  const [eventToEdit, setEventToEdit] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    gameType: GameType;
    format: TournamentFormat;
    skillLevel: string;
    maxPlayers: number;
    entryFee: number;
    addPlayoffStage: boolean;
  }>({ name: "", gameType: "Singles", format: "Round Robin", skillLevel: "3.5-4.0", maxPlayers: 32, entryFee: 50, addPlayoffStage: false });

  const updateEventMutation = useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: any }) => eventAPI.update(eventId, data),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      setEventToEdit(null);
      toast.success("Event updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update event");
    },
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
    if (!editForm.name?.trim()) {
      toast.error("Please enter an event name");
      return;
    }
    updateEventMutation.mutate({
      eventId: eventToEdit._id,
      data: {
        name: editForm.name.trim(),
        format: gameTypeToFormat(editForm.gameType),
        playFormat: displayToPlayFormat(editForm.format),
        addPlayoffStage: displayToPlayFormat(editForm.format) !== 'round-robin',
        skillLevel: editForm.skillLevel,
        maxTeams: editForm.maxPlayers,
        entryFee: editForm.entryFee,
      },
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-display font-bold">Events</h3>
        <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Add a new event to this tournament
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="event-name">Event Name *</Label>
                <Input
                  id="event-name"
                  placeholder="e.g., Men's Singles"
                  value={newEvent.name}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Game Type</Label>
                  <Select
                    value={newEvent.gameType}
                    onValueChange={(v: GameType) =>
                      setNewEvent({ ...newEvent, gameType: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {gameTypes.map((gt) => (
                        <SelectItem key={gt} value={gt}>
                          {gt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select
                    value={newEvent.format}
                    onValueChange={(v: TournamentFormat) =>
                      setNewEvent({ ...newEvent, format: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tournamentFormats.map((tf) => (
                        <SelectItem key={tf} value={tf}>
                          {tf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Skill Level Range</Label>
                  <Select
                    value={newEvent.skillLevel}
                    onValueChange={(v) =>
                      setNewEvent({ ...newEvent, skillLevel: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="e.g. 3.5-4.0" />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_LEVEL_RANGES.map((range) => (
                        <SelectItem key={range} value={range}>
                          {range}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    {newEvent.gameType === "Singles" ? "Max Players" : "Max Teams"}
                  </Label>
                  <Input
                    type="number"
                    min={2}
                    value={newEvent.maxPlayers}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        maxPlayers: parseInt(e.target.value) || (newEvent.gameType === "Singles" ? 32 : 16),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {newEvent.gameType === "Singles"
                      ? "Maximum number of players"
                      : "Maximum number of teams (pairs)"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Entry Fee ($)</Label>
                  <Input
                    type="number"
                    value={newEvent.entryFee}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        entryFee: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateEventOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={onCreateEvent} disabled={createEventPending}>
                {createEventPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event: any, index: number) => (
            <div
              key={event._id}
              className="glass-card-hover rounded-2xl p-6 animate-fade-in"
              style={{
                animationDelay: `${Math.min(index * 0.1, 0.5)}s`,
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="font-display font-bold text-lg">
                    {event.name}
                  </h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="capitalize">
                      {(event.format || "").replace("-", " ")}
                    </Badge>
                    <Badge variant="accent">{formatEventSkillLevel(event.skillLevel)}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {(event.format || "").toLowerCase() === "singles" ? "Players" : "Teams"}
                    </div>
                    <div className="font-semibold">
                      {event.currentTeams || 0}/{event.maxTeams}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Entry Fee
                    </div>
                    <div className="font-display font-bold text-primary">
                      ${event.entryFee}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {allowWaitlist && (
                      <Button variant="outline" onClick={() => setWaitlistEvent({ _id: event._id, name: event.name })}>
                        <Users className="w-4 h-4 mr-1" />
                        Waitlist
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => openEditEvent(event)}>
                      <Settings className="w-4 h-4 mr-1" />
                      Settings
                    </Button>
                    <Button asChild>
                      <Link to={`/tournaments/${tournamentId}/events/${event._id}/pools`}>
                        Pools
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => onDeleteEvent(event._id, event.name)}
                      title="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No events have been added yet.</p>
        </div>
      )}

      <Dialog open={!!waitlistEvent} onOpenChange={(open) => !open && setWaitlistEvent(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Waitlist — {waitlistEvent?.name ?? ""}</DialogTitle>
            <DialogDescription>
              Approve someone to send them an email to pay and complete registration. They have 24 hours to register.
            </DialogDescription>
          </DialogHeader>
          {waitlistEvent && (
            <WaitlistDialogContent eventId={waitlistEvent._id} onClose={() => setWaitlistEvent(null)} toast={toast} queryClient={queryClient} />
          )}
        </DialogContent>
      </Dialog>

      {/* Event Settings dialog */}
      <Dialog open={!!eventToEdit} onOpenChange={(open) => !open && setEventToEdit(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Settings</DialogTitle>
            <DialogDescription>
              Update name, format, capacity, and entry fee for this event.
            </DialogDescription>
          </DialogHeader>
          {eventToEdit && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-event-name">Event Name *</Label>
                <Input
                  id="edit-event-name"
                  placeholder="e.g., Men's Singles"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Game Type</Label>
                  <Select
                    value={editForm.gameType}
                    onValueChange={(v: GameType) => setEditForm({ ...editForm, gameType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {gameTypes.map((gt) => (
                        <SelectItem key={gt} value={gt}>
                          {gt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select
                    value={editForm.format}
                    onValueChange={(v: TournamentFormat) => setEditForm({ ...editForm, format: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tournamentFormats.map((tf) => (
                        <SelectItem key={tf} value={tf}>
                          {tf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Skill Level Range</Label>
                  <Select
                    value={editForm.skillLevel}
                    onValueChange={(v) => setEditForm({ ...editForm, skillLevel: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="e.g. 3.5-4.0" />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_LEVEL_RANGES.map((range) => (
                        <SelectItem key={range} value={range}>
                          {range}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{editForm.gameType === "Singles" ? "Max Players" : "Max Teams"}</Label>
                  <Input
                    type="number"
                    min={2}
                    value={editForm.maxPlayers}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        maxPlayers: parseInt(e.target.value) || (editForm.gameType === "Singles" ? 32 : 16),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {editForm.gameType === "Singles"
                      ? "Maximum number of players"
                      : "Maximum number of teams (pairs)"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Entry Fee ($)</Label>
                  <Input
                    type="number"
                    value={editForm.entryFee}
                    onChange={(e) =>
                      setEditForm({ ...editForm, entryFee: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventToEdit(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEventSettings}
              disabled={updateEventMutation.isPending}
            >
              {updateEventMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizerEventsPanel;
