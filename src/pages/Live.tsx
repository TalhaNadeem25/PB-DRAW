import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/contexts/SocketContext";
import Layout from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Radio, Calendar, MapPin, Users, Trophy, Loader2, ChevronRight, Activity, Zap } from "lucide-react";
import { tournamentAPI, eventAPI, poolAPI, matchAPI } from "@/services/api";
import { format } from "date-fns";

const Live = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);

  // Listen for tournament status changes to refresh the live list
  useEffect(() => {
    if (!socket) return;

    const handleTournamentUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    };

    socket.on('tournament-updated', handleTournamentUpdate);
    return () => { socket.off('tournament-updated', handleTournamentUpdate); };
  }, [socket, queryClient]);

  // Fetch all tournaments
  const { data: tournamentsData, isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentAPI.getAll(),
    refetchInterval: 30000,
  });

  const tournaments = tournamentsData?.data || [];

  // Filter for live tournaments
  const liveTournaments = tournaments.filter((t: any) => t.status === 'in-progress');

  // Fetch matches for selected tournament
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
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground">Loading live tournaments...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Compact top bar — no green hero */}
        <div className="border-b border-border/60 bg-card/50">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Radio className="w-10 h-10 text-primary" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500" />
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                    Live Tournaments
                  </h1>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    Watch live matches and real-time scores
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="destructive" className="px-3 py-1.5 text-sm gap-2 animate-pulse">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                  </span>
                  {liveTournaments.length} Live Now
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Live Tournaments List — Pattern C */}
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {liveTournaments.length === 0 ? (
            <div className="glass-card-hover rounded-2xl p-8 max-w-2xl mx-auto text-center animate-fade-in">
              <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-2xl font-display font-bold mb-3">No Live Tournaments</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                There are no tournaments in progress right now. Check back later or browse upcoming tournaments!
              </p>
              <Button onClick={() => navigate('/tournaments')} variant="hero" size="lg" className="shadow-glow hover:shadow-glow-lg">
                Browse All Tournaments
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {liveTournaments.map((tournament: any, index: number) => (
                <div
                  key={tournament._id}
                  className="glass-card-hover rounded-2xl p-6 cursor-pointer group animate-fade-in overflow-hidden relative"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => navigate(`/live/${tournament._id}`)}
                >
                  <div className="h-1 bg-gradient-to-r from-red-500 via-red-400 to-red-500" />
                  <div className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className="bg-destructive text-destructive-foreground gap-2 px-3 py-1 animate-pulse">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                        </span>
                        LIVE
                      </Badge>
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-hero-gradient group-hover:shadow-glow transition-all duration-300">
                        <Trophy className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                      </div>
                    </div>
                    <h3 className="font-display font-bold text-xl group-hover:text-primary transition-colors mb-2">
                      {tournament.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <MapPin className="w-4 h-4" />
                      {tournament.location}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(tournament.startDate), 'MMM dd')} - {format(new Date(tournament.endDate), 'MMM dd')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-secondary" />
                        {tournament.events?.length || 0} Events
                      </span>
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {tournament.currentPlayers || 0} Players
                      </span>
                    </div>
                    <Button variant="default" size="lg" className="w-full shadow-glow group-hover:shadow-glow-lg transition-all">
                      View Live Matches
                      <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {liveTournaments.length > 0 && (
            <div className="mt-12 grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
              <div className="group glass-card-hover rounded-2xl p-8 text-center animate-fade-in">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Radio className="w-7 h-7 text-destructive animate-pulse" />
                </div>
                <div className="text-3xl font-display font-bold text-destructive mb-1">{liveTournaments.length}</div>
                <div className="text-sm text-muted-foreground">Live Tournaments</div>
              </div>
              <div className="group glass-card-hover rounded-2xl p-8 text-center animate-fade-in">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-hero-gradient group-hover:shadow-glow transition-all duration-300">
                  <Trophy className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <div className="text-3xl font-display font-bold text-primary mb-1">
                  {liveTournaments.reduce((sum: number, t: any) => sum + (t.events?.length || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Events</div>
              </div>
              <div className="group glass-card-hover rounded-2xl p-8 text-center animate-fade-in">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-accent-gradient group-hover:shadow-glow-yellow transition-all duration-300">
                  <Users className="w-7 h-7 text-secondary" />
                </div>
                <div className="text-3xl font-display font-bold mb-1">
                  {liveTournaments.reduce((sum: number, t: any) => sum + (t.currentPlayers || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Players Competing</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Live;
