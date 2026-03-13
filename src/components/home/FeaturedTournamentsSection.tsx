import { cn } from "@/lib/utils";
import { tournamentAPI } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import TournamentCard from "@/components/tournaments/TournamentCard";

const CARD_WIDTH = 344;

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
    <section className="py-24 bg-background overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="max-w-[1200px] mx-auto px-4 md:px-6 mb-12 flex items-center justify-between"
      >
        <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter text-foreground">
          Featured Tournaments
        </h2>
        <div className="hidden md:flex gap-4">
          <button
            onClick={() => scroll("left")}
            className="w-12 h-12 rounded-full border-2 border-border bg-background flex items-center justify-center hover:border-primary hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            aria-label="Scroll left"
          >
            <CaretLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-12 h-12 rounded-full border-2 border-border bg-background flex items-center justify-center hover:border-primary hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            aria-label="Scroll right"
          >
            <CaretRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-6 px-4 md:px-6 max-w-[1200px] mx-auto overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory"
      >
        {tournaments.map((tournament: any, index: number) => {
          let startDateLabel = "";
          let endDateLabel = "";
          try {
            startDateLabel = format(new Date(tournament.startDate), "MMM dd");
            endDateLabel = format(new Date(tournament.endDate), "MMM dd");
          } catch {
            startDateLabel = "";
            endDateLabel = "";
          }

          return (
            <motion.div
              key={tournament._id}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="min-w-[320px] md:min-w-[360px] snap-start"
            >
              <TournamentCard
                id={tournament._id}
                name={tournament.name}
                location={tournament.location}
                startDate={startDateLabel}
                endDate={endDateLabel}
                playerCount={tournament.currentPlayers || 0}
                maxPlayers={tournament.maxPlayers || 64}
                eventCount={tournament.events?.length || 0}
                status={tournament.status}
                entryFee={tournament.entryFee}
                skillLevel={tournament.skillLevel}
                imageUrl={tournament.imageUrl}
                organizerId={tournament.organizer?._id || tournament.organizer}
                registrationDeadline={tournament.registrationDeadline}
              />
            </motion.div>
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
