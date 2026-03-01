import { ConnectAccountStatus } from "@/components/stripe/ConnectAccountStatus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Brain,
  Calendar,
  MapPin,
  Play,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export interface OrganizerDashboardProps {
  myTournaments: any[];
  activeTournaments: any[];
  tournamentsLoading: boolean;
}

export default function OrganizerDashboard({
  myTournaments,
  activeTournaments,
  tournamentsLoading,
}: OrganizerDashboardProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tournaments</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myTournaments.length}</div>
            <p className="text-xs text-muted-foreground">{activeTournaments.length} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tournaments</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTournaments.length}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myTournaments.reduce((sum: number, t: any) => sum + (t.currentPlayers || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all tournaments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Created</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myTournaments.reduce((sum: number, t: any) => sum + (t.events?.length || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total events</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Planner Hero Card */}
      <Card className="border-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl" />
        <CardContent className="pt-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-hero-gradient rounded-2xl flex items-center justify-center shadow-glow">
                <Sparkles className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full mb-3">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-xs font-bold text-primary">NEW FEATURE</span>
              </div>
              <h3 className="font-display font-bold text-2xl mb-2">
                Plan Perfect Tournaments with AI
              </h3>
              <p className="text-muted-foreground mb-6">
                Let AI help you calculate court requirements, suggest events, optimize schedules, and more. Get expert recommendations instantly.
              </p>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <span className="text-sm">Smart Event Suggestions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm">Court Calculations</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-sm">Schedule Optimization</span>
                </div>
              </div>
              <Button asChild size="lg" className="bg-hero-gradient hover:shadow-glow">
                <Link to="/tournament-planner">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Try AI Planner Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Connect - Payment Setup */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Payment Setup</h2>
        <ConnectAccountStatus />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your tournaments efficiently</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button asChild className="h-auto py-6 flex-col gap-2">
            <Link to="/create-tournament">
              <Plus className="w-6 h-6" />
              <span>Create Tournament</span>
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-auto py-6 flex-col gap-2">
            <Link to="/tournaments">
              <Trophy className="w-6 h-6" />
              <span>View All Tournaments</span>
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-auto py-6 flex-col gap-2">
            <Link to="/teams">
              <Users className="w-6 h-6" />
              <span>Manage Teams</span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Active Tournaments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Tournaments</CardTitle>
              <CardDescription>Tournaments currently open or in progress</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/tournaments">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tournamentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : activeTournaments.length > 0 ? (
            <div className="space-y-4">
              {activeTournaments.map((tournament: any) => (
                <div
                  key={tournament._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/tournaments/${tournament._id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{tournament.name}</h3>
                      <Badge variant={tournament.status === "in-progress" ? "default" : "secondary"}>
                        {tournament.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[120px] sm:max-w-none">{tournament.location}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 shrink-0" />
                        {new Date(tournament.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 shrink-0" />
                        {tournament.currentPlayers || 0} players
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No active tournaments</p>
              <Button asChild className="mt-4">
                <Link to="/create-tournament">Create Your First Tournament</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
