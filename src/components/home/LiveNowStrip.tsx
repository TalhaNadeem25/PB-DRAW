import { Link } from "react-router-dom";

// In a real app this would fetch live tournaments
const liveTournaments = [
  { id: 1, name: "Desert Open 2026", url: "/tournaments/1" }
];

const LiveNowStrip = () => {
  if (liveTournaments.length === 0) return null;

  return (
    <div className="bg-amber/10 hover:bg-amber/20 transition-colors border-y border-amber/20 w-full overflow-hidden">
      <Link to={liveTournaments[0].url} className="block py-3 px-4 sm:px-6 max-w-[1200px] mx-auto relative flex items-center group">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full">
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber"></span>
            </span>
            <span className="font-display font-black text-amber-foreground uppercase tracking-widest text-xs md:text-sm">
              Live Now
            </span>
          </div>
          <div className="h-4 w-px bg-amber/30 hidden sm:block" />
          <p className="font-medium text-foreground text-sm md:text-base truncate flex-1">
            Scores are updating for <span className="font-bold underline decoration-amber underline-offset-2">{liveTournaments[0].name}</span>
          </p>
          <span className="text-amber-foreground font-bold text-sm shrink-0 flex items-center gap-1 group-hover:translate-x-1 transition-transform uppercase tracking-wider">
            View Bracket <span aria-hidden="true">&rarr;</span>
          </span>
        </div>
      </Link>
    </div>
  );
};
export default LiveNowStrip;
