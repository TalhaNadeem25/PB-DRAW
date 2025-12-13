import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Radio, ArrowLeft, Trophy, Calendar, MapPin, Loader2, Activity, Clock, AlertCircle } from "lucide-react";
import { tournamentAPI, eventAPI, poolAPI, matchAPI } from "@/services/api";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

const LiveTournamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("in-progress");

  // Fetch tournament
  const { data: tournamentData, isLoading: tournamentLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentAPI.getById(id!),
    enabled: !!id,
  });

  const tournament = tournamentData?.data;

  // Fetch events
  const { data: eventsData } = useQuery({
    queryKey: ['tournament-events', id],
    queryFn: () => eventAPI.getByTournament(id!),
    enabled: !!id,
  });

  const events = eventsData?.data || [];

  // Fetch all matches for the tournament
  const { data: allMatchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['tournament-live-matches', id, selectedEventId],
    queryFn: async () => {
      const eventsToFetch = selectedEventId === "all"
        ? events
        : events.filter((e: any) => e._id === selectedEventId);

      const allMatches: any[] = [];

      for (const event of eventsToFetch) {
        const poolsResponse = await poolAPI.getByEvent(event._id);
        const pools = poolsResponse.data || [];

        for (const pool of pools) {
          const matchesResponse = await matchAPI.getByPool(pool._id);
          const matches = matchesResponse.data || [];

          const matchesWithContext = matches.map((match: any) => ({
            ...match,
            pool: { _id: pool._id, name: pool.name },
            event: { _id: event._id, name: event.name },
          }));

          allMatches.push(...matchesWithContext);
        }
      }

      return allMatches;
    },
    enabled: !!id && events.length > 0,
    refetchInterval: 5000, // Refetch every 5 seconds for live updates
  });

  const allMatches = allMatchesData || [];

  // Filter matches by status
  const filteredMatches = allMatches.filter((match: any) => {
    if (statusFilter === "all") return true;
    return match.status === statusFilter;
  });

  // Sort matches: in-progress first, then by scheduled time
  const sortedMatches = [...filteredMatches].sort((a: any, b: any) => {
    if (a.status === 'in-progress' && b.status !== 'in-progress') return -1;
    if (a.status !== 'in-progress' && b.status === 'in-progress') return 1;
    if (a.scheduledTime && b.scheduledTime) {
      return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
    }
    return 0;
  });

  const liveMatchCount = allMatches.filter((m: any) => m.status === 'in-progress').length;

  // Get team name
  const getTeamName = (team: any) => {
    if (!team) return 'TBD';
    if (team.name) return team.name;
    if (team.players && team.players.length > 0) {
      return team.players.map((p: any) => p.name).join(' / ');
    }
    return 'Unknown Team';
  };

  if (tournamentLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!tournament) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Tournament not found</AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-hero-gradient py-12">
          <div className="container mx-auto px-4">
            <Link
              to="/live"
              className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Live Tournaments
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-red-500 text-white gap-1 animate-pulse">
                <Radio className="w-4 h-4" />
                LIVE
              </Badge>
              <h1 className="text-4xl font-display font-bold text-primary-foreground">
                {tournament.name}
              </h1>
            </div>

            <div className="flex flex-wrap gap-4 text-primary-foreground/80">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {tournament.location}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {format(new Date(tournament.startDate), 'MMM dd')} - {format(new Date(tournament.endDate), 'MMM dd')}
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                {liveMatchCount} Matches In Progress
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b bg-card/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Event</label>
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      {events.map((event: any) => (
                        <SelectItem key={event._id} value={event._id}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="all">All Matches</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-sm text-muted-foreground">
                  Auto-updating every 5 seconds
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Matches */}
        <div className="container mx-auto px-4 py-8">
          {matchesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sortedMatches.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-bold text-lg mb-2">No Matches Found</h3>
                <p className="text-muted-foreground">
                  {statusFilter === "in-progress"
                    ? "No matches are currently in progress"
                    : "No matches match your filters"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedMatches.map((match: any) => {
                const isLive = match.status === 'in-progress';
                const isCompleted = match.status === 'completed';
                const team1Score = match.score?.team1Score ?? 0;
                const team2Score = match.score?.team2Score ?? 0;

                return (
                  <Card
                    key={match._id}
                    className={`${
                      isLive ? 'border-red-500 border-2 shadow-lg' : ''
                    } transition-all`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <Badge variant="outline" className="text-xs">
                            {match.event.name}
                          </Badge>
                          <CardDescription className="text-xs">
                            {match.pool.name}
                          </CardDescription>
                        </div>
                        {isLive && (
                          <Badge className="bg-red-500 text-white gap-1">
                            <Radio className="w-3 h-3 animate-pulse" />
                            LIVE
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge className="bg-green-500 text-white">
                            Final
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Team 1 */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1 font-semibold text-sm">
                            {getTeamName(match.team1)}
                          </div>
                          <div className={`text-2xl font-bold ${
                            isCompleted && team1Score > team2Score ? 'text-green-600' : ''
                          }`}>
                            {team1Score}
                          </div>
                        </div>

                        {/* Team 2 */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1 font-semibold text-sm">
                            {getTeamName(match.team2)}
                          </div>
                          <div className={`text-2xl font-bold ${
                            isCompleted && team2Score > team1Score ? 'text-green-600' : ''
                          }`}>
                            {match.team2 ? team2Score : '-'}
                          </div>
                        </div>

                        {/* Match Info */}
                        <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                          {match.scheduledTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(match.scheduledTime), 'h:mm a')}
                            </div>
                          )}
                          {match.courtNumber && (
                            <div>Court {match.courtNumber}</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LiveTournamentDetail;
