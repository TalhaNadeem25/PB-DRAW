import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkle, Lightning, Brain, TrendUp, ArrowRight, Plus } from "@phosphor-icons/react";
import AIPlannerChat from "@/components/tournament/EnhancedAIPlannerChat";
import { tournamentAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const TournamentPlanner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [showPlanner, setShowPlanner] = useState(false);

  const { data: tournamentsData } = useQuery({
    queryKey: ['my-tournaments'],
    queryFn: () => tournamentAPI.getAll({ organizer: 'me' }),
    enabled: !!user && user.role === 'organizer',
  });

  const myTournaments = tournamentsData?.data || [];

  const handleStartPlanning = () => {
    if (!user) {
      toast.error("Please login to use the AI Planner");
      navigate('/login');
      return;
    }

    if (user.role !== 'organizer' && user.role !== 'admin') {
      toast.error("AI Planner is only available for tournament organizers");
      return;
    }

    if (!selectedTournamentId) {
      toast.error("Please select a tournament or create a new one");
      return;
    }

    setShowPlanner(true);
  };

  const handleCreateNewTournament = () => {
    navigate('/create-tournament');
  };

  const features = [
    {
      icon: Brain,
      title: "Smart Event Suggestions",
      description: "AI recommends optimal events based on skill levels, formats, and player demographics"
    },
    {
      icon: Zap,
      title: "Court Calculations",
      description: "Instantly calculate required courts based on players, time, and match duration"
    },
    {
      icon: TrendUp,
      title: "Schedule Optimization",
      description: "Generate optimal schedules that maximize court usage and minimize wait times"
    },
    {
      icon: Sparkles,
      title: "One-Click Setup",
      description: "Apply AI suggestions with one click to automatically create events and configure your tournament"
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {!showPlanner ? (
          <>
            {/* Compact top bar — no green hero */}
            <div className="border-b border-border/60 bg-card/50">
              <div className="container mx-auto px-4 py-6">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkle className="w-6 h-6 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">AI-Powered Planning</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                  AI Tournament Planner
                </h1>
              </div>
            </div>
            {/* Landing Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-16 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
                <Sparkle className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm font-semibold text-primary">AI-Powered Tournament Planning</span>
              </div>

              <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl mb-6 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Plan Perfect Tournaments
                <br />
                with AI
              </h1>

              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Let artificial intelligence help you plan every aspect of your pickleball tournament.
                From court requirements to event suggestions, scheduling to pricing—get expert recommendations instantly.
              </p>

              {/* CTA Section */}
              <div className="glass-card-hover rounded-2xl p-8 max-w-2xl mx-auto mb-16">
                <h3 className="font-display font-bold text-2xl mb-4">Get Started</h3>
                <p className="text-muted-foreground mb-6">
                  Select an existing tournament to plan, or create a new one
                </p>

                {user?.role === 'organizer' || user?.role === 'admin' ? (
                  <div className="space-y-4">
                    <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a tournament to plan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {myTournaments.map((tournament: any) => (
                          <SelectItem key={tournament._id} value={tournament._id}>
                            {tournament.name} ({tournament.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={handleStartPlanning}
                        disabled={!selectedTournamentId}
                        className="flex-1"
                        variant="default"
                        size="lg"
                      >
                        <Sparkle className="w-5 h-5 mr-2" />
                        Start Planning with AI
                      </Button>

                      <Button
                        onClick={handleCreateNewTournament}
                        variant="outline"
                        size="lg"
                        className="flex-1"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Create New Tournament
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      You need an organizer account to use the AI Planner
                    </p>
                    <Button
                      onClick={() => navigate('/login')}
                      variant="default"
                      size="lg"
                    >
                      Login as Organizer
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Features Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {features.map((feature, idx) => (
                  <Card key={idx} className="glass-card-hover rounded-2xl border-border/50 group animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                    <CardContent className="p-6 text-center">
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:shadow-glow transition-all duration-300">
                        <feature.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                      </div>
                      <h3 className="font-display font-bold text-lg mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Example Questions */}
              <div className="glass-card-hover rounded-2xl p-8 max-w-3xl mx-auto">
                <h3 className="font-display font-bold text-2xl mb-6">Ask AI Anything About Tournament Planning</h3>
                <div className="grid sm:grid-cols-2 gap-3 text-left">
                  {[
                    "How many courts do I need for 64 players?",
                    "What events should I create?",
                    "Help me create a schedule",
                    "How should I price my events?",
                    "What's the best tournament format?",
                    "How do I handle skill level divisions?"
                  ].map((question, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Sparkle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{question}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </>
        ) : (
          // Planner Interface — compact top bar
          <>
            <div className="border-b border-border/60 bg-card/50">
              <div className="container mx-auto px-4 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">AI Tournament Planner</h1>
                    <p className="text-muted-foreground text-sm">
                      Planning: {myTournaments.find((t: any) => t._id === selectedTournamentId)?.name}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowPlanner(false)}>
                    Change Tournament
                  </Button>
                </div>
              </div>
            </div>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AIPlannerChat
              tournamentId={selectedTournamentId}
              onEventsCreated={() => {
                toast.success("Events created! Visit your tournament to see them.");
              }}
            />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default TournamentPlanner;
