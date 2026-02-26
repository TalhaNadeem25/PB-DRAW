import { cn } from "@/lib/utils";
import { tournamentAPI } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, MapPin, Users } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";

const CARD_WIDTH = 344; // min-w-[320px] + gap-6 (24px)

const FeaturedTournamentsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -400 : 400,
        behavior: "smooth",
      });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const newIndex = Math.round(scrollRef.current.scrollLeft / CARD_WIDTH);
      setActiveIndex(newIndex);
    }
  };

  const { data } = useQuery({
    queryKey: ["featured-tournaments"],
    queryFn: () => tournamentAPI.getAll({ status: "open", limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const tournaments = (data?.data || []).slice(0, 6);

  if (tournaments.length === 0) return null;

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 mb-12 flex items-center justify-between">
        <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter text-foreground">
          Featured Tournaments
        </h2>
        <div className="hidden md:flex gap-4">
          <button
            onClick={() => scroll("left")}
            className="w-12 h-12 rounded-full border-2 border-border bg-white flex items-center justify-center hover:border-primary hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-12 h-12 rounded-full border-2 border-border bg-white flex items-center justify-center hover:border-primary hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-6 px-4 md:px-6 max-w-[1200px] mx-auto overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory"
      >
        {tournaments.map((tournament: any) => {
          const spotsFilled = tournament.currentPlayers || 0;
          const spotsTotal = tournament.maxPlayers || 64;
          const isFillingFast = spotsTotal - spotsFilled <= 10;
          const isLive = tournament.status === "in-progress";

          let dateLabel = "";
          try {
            dateLabel = `${format(new Date(tournament.startDate), "MMM dd")}–${format(new Date(tournament.endDate), "MMM dd")}`;
          } catch {
            dateLabel = "";
          }

          return (
            <div
              key={tournament._id}
              className="min-w-[320px] md:min-w-[400px] bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col overflow-hidden snap-start"
            >
              <div
                className="relative h-56 w-full bg-cover bg-center bg-muted"
                style={tournament.imageUrl ? { backgroundImage: `url('${tournament.imageUrl}')` } : {}}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span
                    className={`px-3 py-1 rounded bg-white font-display font-black text-[10px] uppercase tracking-widest ${
                      isLive ? "text-amber-500" : "text-primary"
                    }`}
                  >
                    {isLive ? "LIVE" : "OPEN"}
                  </span>
                </div>
                {isFillingFast && (
                  <div className="absolute top-4 right-4">
                    <span className="font-display font-bold text-xs text-white bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center justify-center gap-1.5 border border-white/20">
                      {isLive && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                      Filling Fast
                    </span>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h4 className="text-2xl font-display font-black uppercase tracking-tight leading-none mb-1 shadow-sm line-clamp-1">
                    {tournament.name}
                  </h4>
                  <p className="font-medium text-sm text-white/90 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {tournament.location}
                    {dateLabel && ` • ${dateLabel}`}
                  </p>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col bg-white">
                <div className="flex justify-between items-center mb-4 text-sm font-semibold text-muted-foreground">
                  <span className="bg-muted px-2 py-1 rounded-md">
                    {tournament.skillLevel || "All Levels"}
                  </span>
                  <span className="text-foreground font-bold">
                    {tournament.entryFee ? `$${tournament.entryFee}` : "Free"}
                  </span>
                </div>

                <div className="mt-auto">
                  <div className="flex justify-between items-end mb-2 text-sm font-bold">
                    <span className="text-foreground flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      {spotsFilled}/{spotsTotal} filled
                    </span>
                    <span className="text-muted-foreground font-medium text-xs">
                      {spotsTotal - spotsFilled} spots left
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mb-6 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${isFillingFast ? "bg-amber-400" : "bg-primary"}`}
                      style={{ width: `${Math.min((spotsFilled / spotsTotal) * 100, 100)}%` }}
                    />
                  </div>
                  <Link
                    to={`/tournaments/${tournament._id}`}
                    className="block w-full bg-foreground text-background hover:bg-primary font-display font-bold uppercase tracking-widest text-sm transition-colors py-4 rounded-xl text-center"
                  >
                    Register Now &rarr;
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Carousel dots — mobile only */}
      {tournaments.length > 1 && (
        <div className="flex md:hidden items-center justify-center gap-2 pt-2 pb-4">
          {tournaments.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() =>
                scrollRef.current?.scrollTo({ left: i * CARD_WIDTH, behavior: "smooth" })
              }
              className={cn(
                "rounded-full transition-all duration-300",
                i === activeIndex
                  ? "w-6 h-2 bg-primary"
                  : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedTournamentsSection;
