import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useRef } from "react";

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
      name: "Sun City Open",
      prize: "$15,000",
      date: "Oct 12-14",
      location: "Phoenix, AZ",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC0-c9Q4vgFin7lgo3Th1ci2v4YQuBkwixovIycrMnYN0WgPCgBUPpzw0jP1lTQvgdzVBe_ez0e9cKNUe7Vm8Lj-ZTbyA1_y86ojXYUmpWrvN5aouUJU7mx9fc55Xe-xpzT9pE8NejW1KiIe5DB7WOCXakbpARTP8bHmc7jW-O_nk2HxRwbsCpPexmZdne_v_RG3QyUZxVMcmZsGJMrHYWcnQE6cLJW970VRymTx9Fq9NflMWpaoaOQdnXHNO_rtyMQxFTKdjDWKzY",
      badge: "Featured",
      badgeColor: "bg-primary text-primary-foreground",
    },
    {
      id: 2,
      name: "Emerald Invitational",
      prize: "$25,000",
      date: "Nov 5-7",
      location: "Miami, FL",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAi9HxdUD3l9_m9c9RXDTWMT74r9z3rRJMmZ9QXFokZjMF4OBgzWmAblzfgcvfqDuSsteAXuoRsTu-3Wh-iSF4qovCui6ooP0T7s1k_f8aTHNKjmXbk2zAmg7Ks4EiHqBY7-25_2SUZmcM-R1nsq9groB0U146I6TqoaTa_Mq6MOANrwvI2MKzqwzaODuBleVv8_ybbYYmUm01gROl-qajbc15sv1r7xedMhuM1yEgdSZxKlI5832qfhsN5Y_lVGHoyZoQCZ9rn7ek",
      badge: "Majors",
      badgeColor: "bg-white/20 backdrop-blur text-white",
    },
    {
      id: 3,
      name: "Regional Finals",
      prize: "$5,000",
      date: "Dec 1-3",
      location: "Austin, TX",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwCTk4gGVwe0AKbjZhbGbP8JgJwRj5MY2jvtpaW1QkQm2l_o1IwF5HBbXI3xm_tj_xMP2vir-zqFJhIIeZjko1jBMxlRQLJVQOEMXWcI6vHpBRppxx5UpOYRR7nL7mcBaU2Y0RwdNMaHKJAwccT0AaBxOdx9Rmaj_ia7KwlFZQYo0HpwFsJgedOlNYwrhFi1vv3Q9oGuxvs5iV24dbHI5gVBF53vnVyA7TqcepkHpPlaD1kMB7jUBy2Bjvs2TYLGn8FfyReX5TJmQ",
      badge: "Regional",
      badgeColor: "bg-white/20 backdrop-blur text-white",
    },
  ];

  return (
    <section className="py-24 bg-background-dark overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 mb-12 flex items-center justify-between">
        <h2 className="text-4xl md:text-5xl font-display font-black uppercase italic tracking-tighter">
          Upcoming Majors
        </h2>
        <div className="flex gap-4">
          <button
            onClick={() => scroll("left")}
            className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:border-primary transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:border-primary transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div
        ref={scrollRef}
        className="flex gap-6 px-6 max-w-[1200px] mx-auto overflow-x-auto pb-8 scrollbar-hide"
      >
        {tournaments.map((tournament) => (
          <div
            key={tournament.id}
            className="min-w-[320px] md:min-w-[400px] bg-[#2a303c] rounded-2xl p-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(96,223,32,0.15)]"
          >
            <div className="relative h-64 w-full bg-cover bg-center rounded-xl mb-6" style={{ backgroundImage: `url('${tournament.image}')` }}>
              <div className={`absolute top-4 left-4 ${tournament.badgeColor} px-3 py-1 rounded font-display font-black text-[10px] uppercase`}>
                {tournament.badge}
              </div>
            </div>
            <div className="px-2 pb-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-2xl font-display font-black uppercase italic tracking-tight leading-none">
                  {tournament.name}
                </h4>
                <span className="text-primary font-bold">{tournament.prize}</span>
              </div>
              <p className="text-slate-400 text-sm mb-6 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {tournament.date} • {tournament.location}
              </p>
              <Button
                variant="outline"
                className="w-full bg-white/5 border border-white/10 py-4 rounded-xl font-display font-black uppercase tracking-widest text-sm hover:bg-primary hover:text-primary-foreground transition-all"
                asChild
              >
                <Link to="/tournaments">
                  Register Now
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedTournamentsSection;
