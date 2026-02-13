import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { eventAPI, poolAPI, matchAPI } from "@/services/api";
import MatchSchedule from "./MatchSchedule";

interface TournamentScheduleProps {
  tournamentId: string;
  /** Tournament start date – used so after auto-schedule the court view shows the correct day */
  tournamentStartDate?: string;
}

const TournamentSchedule = ({ tournamentId, tournamentStartDate }: TournamentScheduleProps) => {
  const [selectedEventId, setSelectedEventId] = useState<string>("all");

  // Fetch events for the tournament
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['tournament-events', tournamentId],
    queryFn: () => eventAPI.getByTournament(tournamentId),
    enabled: !!tournamentId,
  });

  const events = eventsData?.data || [];

  // Fetch all pools and their matches for the tournament
  const { data: allData, isLoading: matchesLoading } = useQuery({
    queryKey: ['tournament-matches', tournamentId, selectedEventId],
    queryFn: async () => {
      const eventsToFetch = selectedEventId === "all"
        ? events
        : events.filter((e: any) => e._id === selectedEventId);

      const allMatches: any[] = [];
      const allPools: any[] = [];

      for (const event of eventsToFetch) {
        try {
          // Fetch pools for this event
          const poolsResponse = await poolAPI.getByEvent(event._id);
          const pools = poolsResponse.data || [];

          for (const pool of pools) {
            // Collect pool info
            allPools.push({ _id: pool._id, name: pool.name, event: { _id: event._id, name: event.name } });

            try {
              const matchesResponse = await matchAPI.getByPool(pool._id);
              const matches = matchesResponse.data || [];

              // Add pool info to each match
              const matchesWithPool = matches.map((match: any) => ({
                ...match,
                pool: { _id: pool._id, name: pool.name },
                event: { _id: event._id, name: event.name }
              }));

              allMatches.push(...matchesWithPool);
            } catch (error) {
              console.error(`Error fetching matches for pool ${pool._id}:`, error);
            }
          }
        } catch (error) {
          console.error(`Error fetching pools for event ${event._id}:`, error);
        }
      }

      return { matches: allMatches, pools: allPools };
    },
    enabled: !!tournamentId && events.length > 0,
  });

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
          No events have been created for this tournament yet. Create events and pools to start scheduling matches.
        </AlertDescription>
      </Alert>
    );
  }

  if (matchesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const matches = allData?.matches || [];
  const pools = allData?.pools || [];

  return (
    <MatchSchedule
      tournamentId={tournamentId}
      tournamentStartDate={tournamentStartDate}
      matches={matches}
      pools={pools}
      events={events}
      selectedEventId={selectedEventId}
      onEventChange={setSelectedEventId}
    />
  );
};

export default TournamentSchedule;
