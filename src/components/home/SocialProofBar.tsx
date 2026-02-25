import { Star } from "lucide-react";

const SocialProofBar = () => {
  return (
    <div className="bg-white border-y border-border py-6 w-full shadow-sm relative z-10">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-wrap justify-center items-center gap-6 md:gap-12 text-sm md:text-base font-semibold text-muted-foreground font-display uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <span className="text-foreground text-lg">📍</span>
          Used by clubs in 28 states
        </div>
        <div className="hidden md:block w-1 h-1 rounded-full bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-foreground text-lg">🏆</span>
          340+ tournaments run
        </div>
        <div className="hidden md:block w-1 h-1 rounded-full bg-border" />
        <div className="flex items-center gap-1.5">
          <div className="flex text-amber">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-4 h-4 text-amber fill-amber" />
            ))}
          </div>
          <span className="text-foreground font-bold ml-1">4.8 Avg Rating</span>
        </div>
      </div>
    </div>
  );
};
export default SocialProofBar;
