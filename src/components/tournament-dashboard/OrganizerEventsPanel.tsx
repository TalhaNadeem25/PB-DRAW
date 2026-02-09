import { Link } from "react-router-dom";
import { Plus, Trash2, Settings, Trophy, Loader2 } from "lucide-react";
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
import type { GameType, TournamentFormat, SkillLevel } from "@/types/tournament";

const skillLevels: SkillLevel[] = ["2.5", "3.0", "3.5", "4.0", "4.5", "5.0", "Open"];
const gameTypes: GameType[] = ["Singles", "Doubles", "Mixed Doubles"];
const tournamentFormats: TournamentFormat[] = [
  "Round-Robin",
  "Single Elimination",
  "Double Elimination",
  "Pool+Knockout",
];

interface OrganizerEventsPanelProps {
  tournamentId: string;
  events: any[];
  isCreateEventOpen: boolean;
  setIsCreateEventOpen: (open: boolean) => void;
  newEvent: {
    name: string;
    gameType: GameType;
    format: TournamentFormat;
    skillLevel: SkillLevel;
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
  events,
  isCreateEventOpen,
  setIsCreateEventOpen,
  newEvent,
  setNewEvent,
  onCreateEvent,
  createEventPending,
  onDeleteEvent,
}: OrganizerEventsPanelProps) => {
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
                  <Label>Skill Level</Label>
                  <Select
                    value={newEvent.skillLevel}
                    onValueChange={(v: SkillLevel) =>
                      setNewEvent({ ...newEvent, skillLevel: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {skillLevels.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}+
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Players</Label>
                  <Input
                    type="number"
                    value={newEvent.maxPlayers}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        maxPlayers: parseInt(e.target.value) || 32,
                      })
                    }
                  />
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
                    <Badge variant="accent">{event.skillLevel}+</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Teams</div>
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
                  <div className="flex gap-2">
                    <Button asChild>
                      <Link
                        to={`/tournaments/${tournamentId}/events/${event._id}/pools`}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Manage
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
    </div>
  );
};

export default OrganizerEventsPanel;
