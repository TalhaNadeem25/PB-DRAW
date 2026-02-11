import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FlaskConical,
  Loader2,
  Users,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventAPI, testDataAPI } from "@/services/api";
import { toast } from "sonner";

interface TestDataPanelProps {
  tournamentId: string;
}

const TestDataPanel = ({ tournamentId }: TestDataPanelProps) => {
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState("");
  const [count, setCount] = useState("8");

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ["tournament-events", tournamentId],
    queryFn: () => eventAPI.getByTournament(tournamentId),
    enabled: !!tournamentId,
  });

  const events = eventsData?.data || [];
  const selectedEvent = events.find((e: any) => e._id === selectedEventId);

  const generateMutation = useMutation({
    mutationFn: () =>
      testDataAPI.generate(tournamentId, {
        eventId: selectedEventId,
        count: parseInt(count, 10),
      }),
    onSuccess: (data) => {
      toast.success(data.message || "Test data generated!");
      queryClient.invalidateQueries({ queryKey: ["tournament-registrations", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournament-events", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to generate test data");
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => testDataAPI.clear(tournamentId),
    onSuccess: (data) => {
      toast.success(data.message || "Test data cleared!");
      queryClient.invalidateQueries({ queryKey: ["tournament-registrations", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournament-events", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to clear test data");
    },
  });

  const canGenerate =
    selectedEventId && parseInt(count, 10) >= 1 && parseInt(count, 10) <= 100 && !generateMutation.isPending;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Warning Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
        <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-display font-bold text-sm text-yellow-700">Testing Only</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            This creates fake player accounts and registrations for testing purposes. Use "Clear
            All Test Data" to remove them when done.
          </p>
        </div>
      </div>

      {/* Generate Section */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">Generate Test Registrations</h3>
            <p className="text-sm text-muted-foreground">
              Add fake players/teams to an event for testing
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Event Selection */}
          <div className="space-y-2">
            <Label className="font-display font-semibold text-sm">Event</Label>
            {eventsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading events...
              </div>
            ) : (
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an event..." />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event: any) => (
                    <SelectItem key={event._id} value={event._id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Count Input */}
          <div className="space-y-2">
            <Label className="font-display font-semibold text-sm">
              {selectedEvent?.format === "singles" ? "Number of Players" : "Number of Teams"}
            </Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              placeholder="8"
            />
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={!canGenerate}
              className="w-full gap-2"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Selected Event Info */}
        {selectedEvent && (
          <div className="mt-4 p-3 rounded-xl bg-muted/40 flex flex-wrap gap-3 text-sm">
            <Badge variant="outline" className="capitalize">
              {selectedEvent.format?.replace("-", " ")}
            </Badge>
            <Badge variant="outline">{selectedEvent.skillLevel}+</Badge>
            <span className="text-muted-foreground">
              Currently: {selectedEvent.currentTeams || 0}
              {selectedEvent.maxTeams ? ` / ${selectedEvent.maxTeams}` : ""}{" "}
              {selectedEvent.format === "singles" ? "players" : "teams"}
            </span>
            {selectedEvent.entryFee > 0 && (
              <span className="text-muted-foreground">
                Fee: ${(selectedEvent.entryFee / 100).toFixed(2)}
              </span>
            )}
          </div>
        )}

        {/* Success indicator */}
        {generateMutation.isSuccess && (
          <div className="mt-4 flex items-center gap-2 text-sm text-green-600 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            {(generateMutation.data as any)?.message}
          </div>
        )}
      </div>

      {/* Clear Section */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Clear All Test Data</h3>
              <p className="text-sm text-muted-foreground">
                Remove all test players, teams, and payments from this tournament
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
            className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            {clearMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Clear Test Data
              </>
            )}
          </Button>
        </div>

        {clearMutation.isSuccess && (
          <div className="mt-4 flex items-center gap-2 text-sm text-green-600 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            {(clearMutation.data as any)?.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestDataPanel;
