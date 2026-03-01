import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10 w-full">
        <div className="max-w-2xl text-center md:text-left">
          {/* Headline */}
          <h1 className="text-foreground text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black leading-[0.9] tracking-tighter mb-6 uppercase">
            Find. Play.<br/>
            <span className="text-primary underline decoration-4 underline-offset-8">Win.</span>
          </h1>

          {/* Description */}
          <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed mb-10">
            America's premium pickleball platform. Find tournaments, track matches, and compete in real time.
          </p>

          {/* Primary CTA — one clear action first */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <Button
              size="lg"
              className="rounded-xl h-14 px-8 text-lg font-display font-bold uppercase tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              asChild
            >
              <Link to="/tournaments" className="inline-flex items-center gap-2">
                Browse Tournaments
                <ChevronRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>

          {/* Secondary: organizers + search link */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-sm">
            <Button variant="outline" size="sm" className="rounded-full font-semibold" asChild>
              <Link to="/create-tournament">Host a Tournament (Free)</Link>
            </Button>
            <span className="text-muted-foreground">·</span>
            <Link
              to="/tournaments"
              className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              Search with filters →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
