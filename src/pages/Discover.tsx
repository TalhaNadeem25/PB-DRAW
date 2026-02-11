import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Trophy,
  Filter,
  Loader2,
  Award,
  Clock,
  DollarSign,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { tournamentAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const Discover = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [skillLevelFilter, setSkillLevelFilter] = useState<string>("all");

  const { data: tournamentsData, isLoading } = useQuery({
    queryKey: ['discover-tournaments'],
    queryFn: () => tournamentAPI.getAll(),
    refetchInterval: 30000,
  });

  const tournaments = tournamentsData?.data || [];

  // Filter tournaments
  const filteredTournaments = tournaments.filter((tournament: any) => {
    const matchesSearch = searchQuery === "" ||
      tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tournament.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tournament.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || tournament.status === statusFilter;

    const matchesSkillLevel = skillLevelFilter === "all" ||
      (tournament.events && tournament.events.some((event: any) =>
        event.skillLevel?.toString() === skillLevelFilter
      ));

    return matchesSearch && matchesStatus && matchesSkillLevel;
  });

  // Sort tournaments
  const sortedTournaments = [...filteredTournaments].sort((a: any, b: any) => {
    const statusPriority: any = { 'open': 1, 'upcoming': 2, 'in-progress': 3, 'completed': 4 };
    const aPriority = statusPriority[a.status] || 99;
    const bPriority = statusPriority[b.status] || 99;

    if (aPriority !== bPriority) return aPriority - bPriority;
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string }> = {
      'open': { bg: 'bg-primary/10', text: 'text-primary' },
      'upcoming': { bg: 'bg-blue-500/10', text: 'text-blue-600' },
      'in-progress': { bg: 'bg-orange-500/10', text: 'text-orange-600' },
      'completed': { bg: 'bg-muted', text: 'text-muted-foreground' },
    };
    const variant = variants[status] || variants['completed'];

    return (
      <Badge className={`${variant.bg} ${variant.text} border-0 capitalize`}>
        {status === 'in-progress' ? 'Live' : status}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Compact header — no green hero */}
        <div className="border-b border-border/60 bg-card/50">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <Badge variant="secondary" className="px-2.5 py-0.5">Discover</Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Find Your Next Tournament
            </h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Browse and join pickleball tournaments near you. Find the perfect competition for your skill level.
            </p>
          </div>
        </div>

        {/* Filters - Sticky */}
        <div className="sticky top-16 z-30 border-b bg-background/80 backdrop-blur-xl shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search tournaments by name, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-muted/50 border-0 rounded-xl focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] h-12 bg-muted/50 border-0 rounded-xl">
                    <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={skillLevelFilter} onValueChange={setSkillLevelFilter}>
                  <SelectTrigger className="w-[150px] h-12 bg-muted/50 border-0 rounded-xl">
                    <Award className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="2.5">2.5</SelectItem>
                    <SelectItem value="3.0">3.0</SelectItem>
                    <SelectItem value="3.5">3.5</SelectItem>
                    <SelectItem value="4.0">4.0</SelectItem>
                    <SelectItem value="4.5">4.5</SelectItem>
                    <SelectItem value="5.0">5.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Tournament Grid */}
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="glass p-8 rounded-2xl text-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading tournaments...</p>
              </div>
            </div>
          ) : sortedTournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedTournaments.map((tournament: any, index: number) => (
                <Card
                  key={tournament._id}
                  className="glass border-0 shadow-float hover:shadow-glow transition-all duration-300 cursor-pointer group animate-fade-in overflow-hidden"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => navigate(`/tournaments/${tournament._id}`)}
                >
                  {/* Gradient top border based on status */}
                  <div className={`h-1 ${
                    tournament.status === 'open' ? 'bg-gradient-to-r from-primary to-secondary' :
                    tournament.status === 'in-progress' ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                    'bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/10'
                  }`} />

                  <CardHeader className="pt-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors line-clamp-1">
                          {tournament.name}
                        </CardTitle>
                      </div>
                      {getStatusBadge(tournament.status)}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {tournament.description || "No description available"}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Date */}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <span>
                        {format(new Date(tournament.startDate), 'MMM dd')} - {format(new Date(tournament.endDate), 'MMM dd, yyyy')}
                      </span>
                    </div>

                    {/* Location */}
                    {tournament.location && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span className="truncate">{tournament.location}</span>
                      </div>
                    )}

                    {/* Registration Deadline */}
                    {tournament.registrationDeadline && tournament.status === 'open' && (
                      <div className="flex items-center gap-3 text-sm text-orange-600">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <Clock className="w-4 h-4" />
                        </div>
                        <span>Register by {format(new Date(tournament.registrationDeadline), 'MMM dd')}</span>
                      </div>
                    )}

                    {/* Entry Fee & Levels */}
                    <div className="flex items-center justify-between pt-2">
                      {tournament.entryFee ? (
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                          <DollarSign className="w-4 h-4" />
                          <span>${tournament.entryFee}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Free entry</span>
                      )}

                      {tournament.events && tournament.events.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {[...new Set(tournament.events.map((e: any) => e.skillLevel).filter(Boolean))].slice(0, 3).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    {tournament.status === 'open' && (
                      <Button
                        variant="hero"
                        className="w-full mt-4 h-11 hover-lift shadow-glow group-hover:shadow-glow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isAuthenticated) {
                            toast.error("Please log in to register for tournaments");
                            navigate("/login");
                          } else {
                            navigate(`/tournaments/${tournament._id}`);
                          }
                        }}
                      >
                        View Details & Register
                        <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="max-w-md mx-auto glass border-0 shadow-float">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">No tournaments found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== "all" || skillLevelFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Check back soon for new tournaments"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Discover;
