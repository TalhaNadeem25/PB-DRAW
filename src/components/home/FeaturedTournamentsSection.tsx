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
    scrollRef.current?.scrollBy({ left: direction === "left" ? -400 : 400, behavior: "smooth" });
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      setActiveIndex(Math.round(scrollRef.current.scrollLeft / CARD_WIDTH));
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
    <section className="py-24 bg-pb-paper overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="max-w-[1200px] mx-auto px-4 md:px-6 mb-12 flex items-center justify-between"
      >
        <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter text-pb-ink">
          Featured Tournaments
        </h2>
        <div className="hidden md:flex gap-3">
          {(["left", "right"] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => scroll(dir)}
              className="w-11 h-11 rounded-[6px] border border-pb-hairline bg-pb-surface flex items-center justify-center text-pb-muted hover:border-pb-rule hover:text-pb-ink transition-colors focus:outline-none"
              aria-label={`Scroll ${dir}`}
            >
              {dir === "left" ? <CaretLeft size={16} /> : <CaretRight size={16} />}
            </button>
          ))}
        </div>
      </motion.div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-6 px-4 md:px-6 max-w-[1200px] mx-auto overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory"
      >
        {tournaments.map((tournament: any, index: number) => {
          let startDateLabel = "", endDateLabel = "";
          try {
            startDateLabel = format(new Date(tournament.startDate), "MMM dd");
            endDateLabel = format(new Date(tournament.endDate), "MMM dd");
          } catch { /* noop */ }

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

      {tournaments.length > 1 && (
        <div className="flex md:hidden items-center justify-center gap-2 pt-2 pb-4">
          {tournaments.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => scrollRef.current?.scrollTo({ left: i * CARD_WIDTH, behavior: "smooth" })}
              className={cn(
                "rounded-full transition-all duration-300",
                i === activeIndex ? "w-6 h-2 bg-pb-court" : "w-2 h-2 bg-pb-hairline hover:bg-pb-rule"
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
