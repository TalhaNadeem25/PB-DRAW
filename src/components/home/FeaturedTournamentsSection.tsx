import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MapPin, Users } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";

const FeaturedTournamentsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const tournaments = [
    {
      id: 1,
      name: "Desert Open 2026",
      prize: "$15,000",
      date: "Mar 15-16",
      location: "Scottsdale, AZ",
      formats: "Singles • Doubles",
      spotsFilled: 68,
      spotsTotal: 80,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC0-c9Q4vgFin7lgo3Th1ci2v4YQuBkwixovIycrMnYN0WgPCgBUPpzw0jP1lTQvgdzVBe_ez0e9cKNUe7Vm8Lj-ZTbyA1_y86ojXYUmpWrvN5aouUJU7mx9fc55Xe-xpzT9pE8NejW1KiIe5DB7WOCXakbpARTP8bHmc7jW-O_nk2HxRwbsCpPexmZdne_v_RG3QyUZxVMcmZsGJMrHYWcnQE6cLJW970VRymTx9Fq9NflMWpaoaOQdnXHNO_rtyMQxFTKdjDWKzY",
      status: "OPEN",
      urgency: "3 days left",
    },
    {
      id: 2,
      name: "Emerald Invitational",
      prize: "$25,000",
      date: "Nov 5-7",
      location: "Miami, FL",
      formats: "Mixed Doubles",
      spotsFilled: 110,
      spotsTotal: 128,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAi9HxdUD3l9_m9c9RXDTWMT74r9z3rRJMmZ9QXFokZjMF4OBgzWmAblzfgcvfqDuSsteAXuoRsTu-3Wh-iSF4qovCui6ooP0T7s1k_f8aTHNKjmXbk2zAmg7Ks4EiHqBY7-25_2SUZmcM-R1nsq9groB0U146I6TqoaTa_Mq6MOANrwvI2MKzqwzaODuBleVv8_ybbYYmUm01gROl-qajbc15sv1r7xedMhuM1yEgdSZxKlI5832qfhsN5Y_lVGHoyZoQCZ9rn7ek",
      status: "LIVE",
      urgency: "Registering",
    },
    {
      id: 3,
      name: "Regional Finals",
      prize: "$5,000",
      date: "Dec 1-3",
      location: "Austin, TX",
      formats: "Singles • Ranked",
      spotsFilled: 45,
      spotsTotal: 64,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwCTk4gGVwe0AKbjZhbGbP8JgJwRj5MY2jvtpaW1QkQm2l_o1IwF5HBbXI3xm_tj_xMP2vir-zqFJhIIeZjko1jBMxlRQLJVQOEMXWcI6vHpBRppxx5UpOYRR7nL7mcBaU2Y0RwdNMaHKJAwccT0AaBxOdx9Rmaj_ia7KwlFZQYo0HpwFsJgedOlNYwrhFi1vv3Q9oGuxvs5iV24dbHI5gVBF53vnVyA7TqcepkHpPlaD1kMB7jUBy2Bjvs2TYLGn8FfyReX5TJmQ",
      status: "OPEN",
      urgency: "Filling Fast",
    },
  ];

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
        className="flex gap-6 px-4 md:px-6 max-w-[1200px] mx-auto overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory"
      >
        {tournaments.map((tournament) => (
          <div
            key={tournament.id}
            className="min-w-[320px] md:min-w-[400px] bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col overflow-hidden snap-start"
          >
            <div className="relative h-56 w-full bg-cover bg-center" style={{ backgroundImage: `url('${tournament.image}')` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={`px-3 py-1 rounded bg-white font-display font-black text-[10px] uppercase tracking-widest ${tournament.status === 'LIVE' ? 'text-amber' : 'text-primary'}`}>
                  {tournament.status}
                </span>
              </div>
              <div className="absolute top-4 right-4">
                <span className="font-display font-bold text-xs text-white bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center justify-center gap-1.5 border border-white/20">
                  {tournament.status === 'LIVE' && <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />}
                  {tournament.urgency}
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h4 className="text-2xl font-display font-black uppercase tracking-tight leading-none mb-1 shadow-sm">
                  {tournament.name}
                </h4>
                <p className="font-medium text-sm text-white/90 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> {tournament.location} • {tournament.date}
                </p>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col bg-white">
              <div className="flex justify-between items-center mb-4 text-sm font-semibold text-muted-foreground">
                <span className="bg-muted px-2 py-1 rounded-md">{tournament.formats}</span>
                <span className="text-foreground font-bold">{tournament.prize} Prize</span>
              </div>
              
              <div className="mt-auto">
                <div className="flex justify-between items-end mb-2 text-sm font-bold">
                  <span className="text-foreground flex items-center gap-1.5"><Users className="w-4 h-4 text-muted-foreground"/> {tournament.spotsFilled}/{tournament.spotsTotal} filled</span>
                  <span className="text-muted-foreground font-medium text-xs">Spots remaining: {tournament.spotsTotal - tournament.spotsFilled}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-6 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full ${tournament.spotsTotal - tournament.spotsFilled < 20 ? 'bg-amber' : 'bg-primary'}`} 
                    style={{ width: `${(tournament.spotsFilled / tournament.spotsTotal) * 100}%` }}
                  ></div>
                </div>
                <Button
                  className="w-full bg-foreground text-background hover:bg-primary font-display font-bold uppercase tracking-widest text-sm transition-colors py-6 rounded-xl shadow-none"
                  asChild
                >
                  <Link to="/tournaments">
                    Register Now &rarr;
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
export default FeaturedTournamentsSection;
