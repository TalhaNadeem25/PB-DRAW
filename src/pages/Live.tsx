import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Radio, Calendar, MapPin, Users, Trophy, Loader2, ChevronRight, Activity, Zap } from "lucide-react";
import { tournamentAPI, eventAPI, poolAPI, matchAPI } from "@/services/api";
import { format } from "date-fns";

const Live = () => {
  const navigate = useNavigate();
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);

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
        <div className="min-h-screen bg-mesh-gradient flex items-center justify-center">
          <div className="glass p-8 rounded-2xl text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading live tournaments...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="bg-hero-gradient py-16 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-20 w-32 h-32 bg-red-500/20 rounded-full blur-2xl animate-pulse" />
            <div className="absolute bottom-10 right-20 w-40 h-40 bg-secondary/20 rounded-full blur-2xl animate-float" />
            <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-primary-foreground/10 rounded-full blur-xl animate-float" style={{ animationDelay: "1s" }} />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex items-center justify-center gap-4 mb-6 animate-fade-in">
              {/* Pulsing live indicator */}
              <div className="relative">
                <Radio className="w-12 h-12 text-primary-foreground" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-bold text-primary-foreground">
                Live Tournaments
              </h1>
            </div>
            <p className="text-center text-primary-foreground/80 text-lg max-w-2xl mx-auto mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Watch live matches and real-time scores from ongoing tournaments
            </p>
            
            {/* Live count badge */}
            <div className="flex items-center justify-center gap-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <Badge variant="destructive" className="px-4 py-2 text-base gap-2 animate-pulse">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
                {liveTournaments.length} Tournament{liveTournaments.length !== 1 ? 's' : ''} Live Now
              </Badge>
            </div>
          </div>
        </div>

        {/* Live Tournaments List */}
        <div className="container mx-auto px-4 py-12">
          {liveTournaments.length === 0 ? (
            <Card className="max-w-2xl mx-auto glass border-0 shadow-float">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <Activity className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-3">No Live Tournaments</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  There are no tournaments in progress right now. Check back later or browse upcoming tournaments!
                </p>
                <Button onClick={() => navigate('/tournaments')} variant="hero" className="hover-lift shadow-glow">
                  Browse All Tournaments
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {liveTournaments.map((tournament: any, index: number) => (
                <Card
                  key={tournament._id}
                  className="glass border-0 shadow-float hover:shadow-glow transition-all duration-300 cursor-pointer group animate-fade-in overflow-hidden"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => navigate(`/live/${tournament._id}`)}
                >
                  {/* Red accent bar for live */}
                  <div className="h-1 bg-gradient-to-r from-red-500 via-red-400 to-red-500" />
                  
                  <CardHeader className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className="bg-red-500 text-white gap-2 px-3 py-1 animate-pulse">
                        <Radio className="w-3 h-3" />
                        LIVE
                      </Badge>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Trophy className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {tournament.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <MapPin className="w-4 h-4" />
                      {tournament.location}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(new Date(tournament.startDate), 'MMM dd')} - {format(new Date(tournament.endDate), 'MMM dd')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Zap className="w-4 h-4 text-secondary" />
                          <span>{tournament.events?.length || 0} Events</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{tournament.currentPlayers || 0} Players</span>
                        </div>
                      </div>

                      <Button className="w-full h-12 group-hover:bg-primary group-hover:text-primary-foreground transition-all hover-lift">
                        View Live Matches
                        <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Quick Stats */}
          {liveTournaments.length > 0 && (
            <div className="mt-12 grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
              <Card className="glass border-0 shadow-float hover-lift">
                <CardContent className="pt-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Radio className="w-7 h-7 text-red-500 animate-pulse" />
                  </div>
                  <div className="text-4xl font-display font-bold text-red-500 mb-1">
                    {liveTournaments.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Live Tournaments</div>
                </CardContent>
              </Card>
              
              <Card className="glass border-0 shadow-float hover-lift">
                <CardContent className="pt-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Trophy className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-4xl font-display font-bold text-primary mb-1">
                    {liveTournaments.reduce((sum: number, t: any) => sum + (t.events?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Events</div>
                </CardContent>
              </Card>
              
              <Card className="glass border-0 shadow-float hover-lift">
                <CardContent className="pt-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Users className="w-7 h-7 text-secondary" />
                  </div>
                  <div className="text-4xl font-display font-bold text-secondary mb-1">
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
