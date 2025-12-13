import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Radio, Calendar, MapPin, Users, Trophy, Loader2, AlertCircle, ChevronRight, Activity } from "lucide-react";
import { tournamentAPI, eventAPI, poolAPI, matchAPI } from "@/services/api";
import { format } from "date-fns";

const Live = () => {
  const navigate = useNavigate();
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);

  // Fetch all tournaments
  const { data: tournamentsData, isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentAPI.getAll(),
    refetchInterval: 30000, // Refetch every 30 seconds for live updates
  });

  const tournaments = tournamentsData?.data || [];

  // Filter for live tournaments (in-progress status)
  const liveTournaments = tournaments.filter((t: any) => t.status === 'in-progress');

  // Fetch matches for selected tournament to get live count
  const { data: selectedTournamentData } = useQuery({
    queryKey: ['tournament-live-data', selectedTournament],
    queryFn: async () => {
      if (!selectedTournament) return null;

      const eventsResponse = await eventAPI.getByTournament(selectedTournament);
      const events = eventsResponse.data || [];

      let totalMatches = 0;
      let liveMatches = 0;

      for (const event of events) {
        const poolsResponse = await poolAPI.getByEvent(event._id);
        const pools = poolsResponse.data || [];

        for (const pool of pools) {
          const matchesResponse = await matchAPI.getByPool(pool._id);
          const matches = matchesResponse.data || [];

          totalMatches += matches.length;
          liveMatches += matches.filter((m: any) => m.status === 'in-progress').length;
        }
      }

      return { totalMatches, liveMatches };
    },
    enabled: !!selectedTournament,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="bg-hero-gradient py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Radio className="w-10 h-10 text-primary-foreground animate-pulse" />
              <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground">
                Live Tournaments
              </h1>
            </div>
            <p className="text-center text-primary-foreground/80 text-lg max-w-2xl mx-auto">
              Watch live matches and real-time scores from ongoing tournaments
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-primary-foreground font-semibold">
                {liveTournaments.length} Tournament{liveTournaments.length !== 1 ? 's' : ''} Live Now
              </span>
            </div>
          </div>
        </div>

        {/* Live Tournaments List */}
        <div className="container mx-auto px-4 py-12">
          {liveTournaments.length === 0 ? (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="py-16 text-center">
                <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-2xl font-bold mb-2">No Live Tournaments</h3>
                <p className="text-muted-foreground mb-6">
                  There are no tournaments in progress right now. Check back later!
                </p>
                <Button onClick={() => navigate('/tournaments')}>
                  Browse All Tournaments
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {liveTournaments.map((tournament: any) => (
                <Card
                  key={tournament._id}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => navigate(`/live/${tournament._id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge className="bg-red-500 text-white gap-1 animate-pulse">
                        <Radio className="w-3 h-3" />
                        LIVE
                      </Badge>
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {tournament.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <MapPin className="w-4 h-4" />
                      {tournament.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(new Date(tournament.startDate), 'MMM dd')} - {format(new Date(tournament.endDate), 'MMM dd')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{tournament.events?.length || 0} Events</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                          View Live Matches
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Quick Stats */}
          {liveTournaments.length > 0 && (
            <div className="mt-12 grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Radio className="w-8 h-8 mx-auto mb-2 text-primary animate-pulse" />
                  <div className="text-3xl font-bold text-primary">
                    {liveTournaments.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Live Tournaments</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <div className="text-3xl font-bold">
                    {liveTournaments.reduce((sum: number, t: any) => sum + (t.events?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Events</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <div className="text-3xl font-bold">
                    {liveTournaments.reduce((sum: number, t: any) => sum + (t.currentPlayers || 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Players Competing</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Live;
