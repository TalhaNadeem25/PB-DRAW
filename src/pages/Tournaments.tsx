import Layout from "@/components/layout/Layout";
import TournamentCard from "@/components/tournaments/TournamentCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { SkeletonGrid } from '@/components/ui/skeleton-card';
import { cn } from "@/lib/utils";
import { tournamentAPI } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Check,
  Filter,
  Search,
  Trophy
} from "lucide-react";
import { useState } from "react";

const Tournaments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [skillFilter, setSkillFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["tournaments", searchQuery, statusFilter], // In a real app add all filters
    queryFn: () =>
      tournamentAPI.getAll({
        status: statusFilter,
        search: searchQuery,
        limit: 50,
      }),
  });

  const tournaments = data?.data || [];

  const formattedTournaments = tournaments.map((tournament: any) => ({
    id: tournament._id,
    name: tournament.name,
    location: tournament.location,
    startDate: format(new Date(tournament.startDate), "MMM dd"),
    endDate: format(new Date(tournament.endDate), "MMM dd"),
    playerCount: tournament.currentPlayers || 0,
    maxPlayers: tournament.maxPlayers,
    eventCount: tournament.events?.length || 0,
    status: tournament.status,
    featured: false,
    entryFee: tournament.entryFee || 0,
    skillLevel: tournament.skillLevel || "All Levels",
    imageUrl: tournament.imageUrl || "",
    organizerId: typeof tournament.organizer === 'string' ? tournament.organizer : tournament.organizer?._id,
  }));

  const activeFiltersCount = 
    (statusFilter !== "all" ? 1 : 0) + 
    (locationFilter !== "all" ? 1 : 0) + 
    (skillFilter !== "all" ? 1 : 0) +
    (priceFilter !== "all" ? 1 : 0) +
    (formatFilter !== "all" ? 1 : 0);

  const FilterOptions = () => (
    <div className="space-y-6">
      {/* Location */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">Location</h3>
        <div className="space-y-2">
          {["all", "near", "ca", "fl", "tx"].map((val) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer group">
              <div className={cn(
                "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                locationFilter === val ? "border-primary bg-primary" : "border-muted-foreground group-hover:border-primary"
              )}>
                {locationFilter === val && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <span className="text-sm font-medium">{val === "all" ? "All Locations" : val === "near" ? "Near Me" : val.toUpperCase()}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Skill Level */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">Skill Level</h3>
        <div className="space-y-2">
          {["all", "2.5", "3.0", "3.5", "4.0", "4.5"].map((val) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer group">
              <div className={cn(
                "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                skillFilter === val ? "border-primary bg-primary text-white" : "border-muted-foreground group-hover:border-primary text-transparent"
              )}>
                <Check className="w-3 h-3" strokeWidth={3} />
              </div>
              <span className="text-sm font-medium">{val === "all" ? "All Levels" : val}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">Status</h3>
        <div className="space-y-2">
          {["all", "open", "in-progress", "completed"].map((val) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer group">
              <div className={cn(
                "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                statusFilter === val ? "border-primary bg-primary" : "border-muted-foreground group-hover:border-primary"
              )}>
                {statusFilter === val && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <span className="text-sm font-medium capitalize">{val === "in-progress" ? "Live" : val}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Entry Fee */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">Entry Fee</h3>
        <div className="space-y-2">
          {["all", "0", "50", "100"].map((val) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer group">
              <div className={cn(
                "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                priceFilter === val ? "border-primary bg-primary" : "border-muted-foreground group-hover:border-primary"
              )}>
                {priceFilter === val && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <span className="text-sm font-medium capitalize">{val === "all" ? "Any Price" : val === "0" ? "Free" : `Under $${val}`}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Format */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">Format</h3>
        <div className="space-y-2">
          {["all", "singles", "doubles", "mixed"].map((val) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer group">
              <div className={cn(
                "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                formatFilter === val ? "border-primary bg-primary text-white" : "border-muted-foreground group-hover:border-primary text-transparent"
              )}>
                <Check className="w-3 h-3" strokeWidth={3} />
              </div>
              <span className="text-sm font-medium capitalize">{val === "all" ? "All Formats" : val}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter text-foreground mb-4">
              Find Tournaments
            </h1>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by tournament name or venue"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-base bg-white border-border rounded-xl shadow-sm"
                />
                <Button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg font-display uppercase tracking-widest font-bold">Search</Button>
              </div>

              {/* Mobile Filter Trigger */}
              <div className="md:hidden">
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline" className="w-full h-14 rounded-xl flex items-center gap-2 shadow-sm border-border bg-white text-foreground font-display uppercase font-bold tracking-wide">
                      <Filter className="w-5 h-5" />
                      Filters {activeFiltersCount > 0 && <Badge className="ml-2 bg-primary">{activeFiltersCount}</Badge>}
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="px-4">
                    <DrawerHeader className="text-left px-0">
                      <DrawerTitle className="font-display font-bold text-2xl uppercase tracking-tight">Filters</DrawerTitle>
                    </DrawerHeader>
                    <div className="overflow-y-auto max-h-[60vh] py-4">
                      <FilterOptions />
                    </div>
                    <DrawerFooter className="px-0 pt-4 pb-8 border-t border-border">
                      <DrawerClose asChild>
                        <Button className="w-full h-14 rounded-xl font-display uppercase tracking-widest font-bold">Show Results</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden md:block w-[280px] shrink-0 sticky top-28 bg-white p-6 rounded-2xl border border-border shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-xl uppercase tracking-tight flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" /> Filters
                </h2>
                {activeFiltersCount > 0 && (
                  <button 
                    onClick={() => {
                      setStatusFilter("all");
                      setLocationFilter("all");
                      setSkillFilter("all");
                      setPriceFilter("all");
                      setFormatFilter("all");
                    }}
                    className="text-xs text-muted-foreground hover:text-primary font-bold uppercase tracking-wider transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              <FilterOptions />
            </aside>

            {/* Main Content Grid */}
            <main className="flex-1 min-w-0 w-full">
              {/* Active filter pills (Desktop) */}
              <div className="hidden md:flex items-center justify-between mb-6">
                <div className="text-muted-foreground font-semibold text-sm uppercase tracking-wide">
                  Showing {formattedTournaments.length} results
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-xs font-display font-semibold tracking-wider text-muted-foreground uppercase">
                    Sort:
                  </span>
                  <select className="bg-transparent text-sm font-bold uppercase tracking-wide focus:outline-none cursor-pointer hover:text-primary transition-colors">
                    <option>Nearest</option>
                    <option>Soonest</option>
                    <option>Most popular</option>
                  </select>
                </div>
              </div>

              {isLoading ? (
                <SkeletonGrid count={6} className="mt-4" />
              ) : error ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-border">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="text-xl font-display font-bold uppercase tracking-tight mb-2">
                    Error loading tournaments
                  </h3>
                  <Button onClick={() => window.location.reload()} className="mt-4 rounded-xl font-display font-bold uppercase tracking-widest">Retry</Button>
                </div>
              ) : formattedTournaments.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {formattedTournaments.map((tournament: any, index: number) => (
                    <div
                      key={tournament.id}
                      className="animate-fade-in"
                      style={{
                        animationDelay: `${Math.min(index * 0.05, 0.5)}s`,
                      }}
                    >
                      <TournamentCard {...tournament} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-32 bg-white rounded-2xl border border-border shadow-sm">
                  <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
                    <Trophy className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-display font-black uppercase tracking-tight mb-2">
                    No tournaments found
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-8 font-medium">
                    Try adjusting your search or filters to find more tournaments.
                  </p>
                  <Button
                    variant="outline"
                    className="font-display font-bold uppercase tracking-widest rounded-xl h-12 px-8"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setLocationFilter("all");
                      setSkillFilter("all");
                      setPriceFilter("all");
                      setFormatFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Tournaments;
