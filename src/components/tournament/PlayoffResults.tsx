import { useQuery } from "@tanstack/react-query";
import { Loader2, Trophy } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { playoffAPI } from "@/services/api";
import ResultsPodium from "./ResultsPodium";

interface Team {
  _id: string;
  name?: string;
  players: Array<{ _id: string; name: string }>;
}

interface Match {
  _id: string;
  team1: Team;
  team2?: Team;
  winner?: Team;
  status: string;
  bracket: string;
  score?: {
    team1Score: number;
    team2Score: number;
  };
}

interface PlayoffResultsProps {
  eventId: string;
  poolId: string;
  poolName?: string;
  eventName?: string;
}

const PlayoffResults = ({ eventId, poolId, poolName, eventName }: PlayoffResultsProps) => {
  // Fetch playoff matches
  const { data: playoffsData, isLoading } = useQuery({
    queryKey: ['playoffs', eventId, poolId],
    queryFn: () => playoffAPI.get(eventId, poolId),
    enabled: !!eventId && !!poolId,
  });

  const playoffs = playoffsData?.data || [];

  // Determine placements from playoff results
  const getPlacementResults = (matches: Match[]) => {
    const finalsMatch = matches.find(m => m.bracket === 'finals');
    const semifinalsMatch = matches.find(m => m.bracket === 'semifinals');

    // Check if playoffs are complete
    if (!finalsMatch || finalsMatch.status !== 'completed' || !finalsMatch.winner) {
      return null; // Playoffs not complete yet
    }

    const results = [];

    // 1st Place: Winner of finals
    results.push({
      place: 1,
      team: finalsMatch.winner,
      score: {
        won: 2, // Won semifinals (if played) + finals
        lost: 0,
      },
    });

    // 2nd Place: Loser of finals
    const finalsLoser = finalsMatch.team1._id === finalsMatch.winner._id
      ? finalsMatch.team2!
      : finalsMatch.team1;

    results.push({
      place: 2,
      team: finalsLoser,
      score: {
        won: 1, // Won semifinals (if played)
        lost: 1, // Lost finals
      },
    });

    // 3rd Place: Loser of semifinals (if semifinals exists)
    if (semifinalsMatch && semifinalsMatch.status === 'completed' && semifinalsMatch.winner && semifinalsMatch.team2) {
      const semifinalsLoser = semifinalsMatch.team1._id === semifinalsMatch.winner._id
        ? semifinalsMatch.team2
        : semifinalsMatch.team1;

      results.push({
        place: 3,
        team: semifinalsLoser,
        score: {
          won: 0,
          lost: 1, // Lost semifinals
        },
      });
    }

    return results;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!playoffs || playoffs.length === 0) {
    return (
      <Alert>
        <Trophy className="h-4 w-4" />
        <AlertDescription>
          Playoffs have not been generated yet. Generate playoffs to see final results.
        </AlertDescription>
      </Alert>
    );
  }

  const results = getPlacementResults(playoffs);

  if (!results) {
    return (
      <Alert>
        <Trophy className="h-4 w-4" />
        <AlertDescription>
          Playoffs are in progress. Final results will appear once all playoff matches are completed.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <ResultsPodium
      results={results}
      poolName={poolName}
      eventName={eventName}
      showScores={true}
    />
  );
};

export default PlayoffResults;
