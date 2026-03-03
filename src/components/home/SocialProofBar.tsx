import { useQuery } from "@tanstack/react-query";
import { statsAPI } from "@/services/api";
import { MapPin, Trophy, Users } from "lucide-react";
import { motion } from "framer-motion";

const SocialProofBar = () => {
  const { data } = useQuery({
    queryKey: ["public-stats"],
    queryFn: () => statsAPI.getPublic(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const stats = data?.data;
  const tournamentsRun = stats?.tournamentsRun ?? 0;
  const organizersCount = stats?.organizersCount ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-muted/30 border-y border-border py-6 w-full shadow-sm relative z-10"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-wrap justify-center items-center gap-6 md:gap-12 text-sm md:text-base font-semibold text-muted-foreground font-display uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-foreground shrink-0" />
          <span>Used by clubs nationwide</span>
        </div>
        <div className="hidden md:block w-1 h-1 rounded-full bg-border" />
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-foreground shrink-0" />
          <span>
            {tournamentsRun > 0 ? `${tournamentsRun}+ tournaments run` : "Tournaments run on Picklix"}
          </span>
        </div>
        {organizersCount > 0 && (
          <>
            <div className="hidden md:block w-1 h-1 rounded-full bg-border" />
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-foreground shrink-0" />
              <span>{organizersCount}+ organizers</span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
export default SocialProofBar;
