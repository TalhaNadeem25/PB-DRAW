import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Trophy, AlertCircle, Info } from "lucide-react";
import { eventAPI, poolAPI, playoffAPI } from "@/services/api";
import { formatEventSkillLevel } from "@/types/tournament";
import PlayoffBracket from "./PlayoffBracket";
import PoolStandings from "./PoolStandings";
import PlayoffResults from "./PlayoffResults";

interface BracketViewerProps {
  tournamentId: string;
}

const BracketViewer = ({ tournamentId }: BracketViewerProps) => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);

  // Fetch events for the tournament
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['tournament-events', tournamentId],
    queryFn: () => eventAPI.getByTournament(tournamentId),
    enabled: !!tournamentId,
  });

  // Fetch pools for selected event
  const { data: poolsData, isLoading: poolsLoading } = useQuery({
    queryKey: ['event-pools', selectedEventId],
    queryFn: () => poolAPI.getByEvent(selectedEventId!),
    enabled: !!selectedEventId,
  });

  // Fetch playoffs for selected pool
  const { data: playoffsData, isLoading: playoffsLoading } = useQuery({
    queryKey: ['playoffs', selectedEventId, selectedPoolId],
    queryFn: () => playoffAPI.get(selectedEventId!, selectedPoolId!),
    enabled: !!selectedEventId && !!selectedPoolId,
  });

  const events = eventsData?.data || [];
  const pools = poolsData?.data || [];
  const playoffs = playoffsData?.data || [];

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    setSelectedPoolId(null); // Reset pool selection when event changes
  };

  const handlePoolChange = (poolId: string) => {
    setSelectedPoolId(poolId);
  };

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No events have been created for this tournament yet. Brackets will be available once events are added and pools are set up.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Select an event and pool below to view the playoff bracket. Brackets are generated after pool play is complete.
        </AlertDescription>
      </Alert>

      {/* Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            View Playoff Brackets
          </CardTitle>
          <CardDescription>
            Choose an event and pool to see the elimination bracket
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Event Selector */}
          <div className="space-y-2">
            <Label>Select Event</Label>
            <Select value={selectedEventId || undefined} onValueChange={handleEventChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an event..." />
              </SelectTrigger>
              <SelectContent>
                {events.map((event: any) => (
                  <SelectItem key={event._id} value={event._id}>
                    {event.name} - {event.format} ({formatEventSkillLevel(event.skillLevel)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pool Selector */}
          {selectedEventId && (
            <div className="space-y-2">
              <Label>Select Pool</Label>
              {poolsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : pools.length > 0 ? (
                <Select value={selectedPoolId || undefined} onValueChange={handlePoolChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a pool..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pools.map((pool: any) => (
                      <SelectItem key={pool._id} value={pool._id}>
                        {pool.name} ({pool.teams?.length || 0} teams)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No pools have been created for this event yet.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pool Standings */}
      {selectedEventId && selectedPoolId && (
        <div className="space-y-6">
          {poolsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Standings Table */}
              <PoolStandings
                teams={pools.find((p: any) => p._id === selectedPoolId)?.teams || []}
                poolName={pools.find((p: any) => p._id === selectedPoolId)?.name}
                showPlayoffIndicators={true}
              />

              {/* Playoff Bracket */}
              {playoffsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : playoffs.length > 0 ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Playoff Bracket</CardTitle>
                      <CardDescription>
                        {pools.find((p: any) => p._id === selectedPoolId)?.name || 'Pool'} - Elimination Rounds
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <PlayoffBracket matches={playoffs} />
                    </CardContent>
                  </Card>

                  {/* Final Results */}
                  <PlayoffResults
                    eventId={selectedEventId!}
                    poolId={selectedPoolId!}
                    poolName={pools.find((p: any) => p._id === selectedPoolId)?.name}
                    eventName={events.find((e: any) => e._id === selectedEventId)?.name}
                  />
                </>
              ) : (
                <Alert>
                  <Trophy className="h-4 w-4" />
                  <AlertDescription>
                    Playoffs have not been generated for this pool yet. The tournament organizer will create the bracket once pool play is complete.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BracketViewer;
