import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import TournamentCard from "@/components/tournaments/TournamentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, MapPin, Loader2, Trophy, SlidersHorizontal, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tournamentAPI } from "@/services/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const Tournaments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch tournaments from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['tournaments', searchQuery, statusFilter],
    queryFn: () => tournamentAPI.getAll({
      status: statusFilter,
      search: searchQuery,
      limit: 50,
    }),
  });

  const tournaments = data?.data || [];

  // Format tournament data for TournamentCard component
  const formattedTournaments = tournaments.map((tournament: any) => ({
    id: tournament._id,
    name: tournament.name,
    location: tournament.location,
    startDate: format(new Date(tournament.startDate), 'MMM dd'),
    endDate: format(new Date(tournament.endDate), 'MMM dd'),
    playerCount: tournament.currentPlayers || 0,
    maxPlayers: tournament.maxPlayers,
    eventCount: tournament.events?.length || 0,
    status: tournament.status,
    featured: false,
  }));

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "open", label: "Registration Open" },
    { value: "closed", label: "Registration Closed" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient" />
          <div className="absolute inset-0 bg-mesh-gradient opacity-50" />
          <div className="absolute inset-0 court-pattern opacity-10" />
          
          {/* Floating orbs */}
          <div className="absolute top-10 right-[10%] w-48 h-48 rounded-full bg-secondary/20 blur-3xl animate-float-slow" />
          <div className="absolute bottom-0 left-[5%] w-64 h-64 rounded-full bg-court-green-dark/30 blur-3xl animate-float" style={{ animationDelay: "1s" }} />
          
          <div className="container mx-auto px-4 py-20 relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark border border-primary-foreground/20 mb-6 animate-fade-in">
                <Trophy className="w-4 h-4 text-secondary" />
                <span className="text-sm font-medium text-primary-foreground">500+ Active Tournaments</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary-foreground mb-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                Find Your Next
                <br />
                <span className="text-secondary">Tournament</span>
              </h1>
              <p className="text-lg text-primary-foreground/80 max-w-2xl animate-fade-in" style={{ animationDelay: "0.2s" }}>
                Discover and register for pickleball tournaments near you. From local club matches to professional championships.
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="container mx-auto px-4 -mt-8 relative z-20">
          <div className="glass-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search tournaments, locations, or organizers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base bg-muted/50 border-border"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Filter buttons */}
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] h-12 bg-muted/50">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button variant="outline" className="h-12 hover-lift">
                  <MapPin className="w-4 h-4 mr-2" />
                  Near Me
                </Button>
                
                <Button 
                  variant={showFilters ? "default" : "outline"} 
                  className="h-12 lg:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Status pills - mobile friendly filter summary */}
            {statusFilter !== "all" && (
              <div className="flex flex-wrap gap-2 mt-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                  {statusOptions.find(o => o.value === statusFilter)?.label}
                  <button onClick={() => setStatusFilter("all")}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="container mx-auto px-4 py-12">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
              <p className="text-muted-foreground">Loading tournaments...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Error loading tournaments</h3>
              <p className="text-muted-foreground mb-4">Please try again later.</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-8">
                <p className="text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{formattedTournaments.length}</span> tournaments
                </p>
              </div>

              {formattedTournaments.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {formattedTournaments.map((tournament: any, index: number) => (
                    <div
                      key={tournament.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                    >
                      <TournamentCard {...tournament} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-6">
                    <Trophy className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-2">No tournaments found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Try adjusting your search or filters to find more tournaments.
                  </p>
                  <Button variant="outline" onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Tournaments;
