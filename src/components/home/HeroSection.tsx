import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, MapPin, Search } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [skill, setSkill] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (location) params.append('location', location);
    if (skill) params.append('skill', skill);
    navigate(`/tournaments?${params.toString()}`);
  };

  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10 w-full flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 text-center md:text-left">
          {/* Headline */}
          <h1 className="text-foreground text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black leading-[0.9] tracking-tighter mb-6 uppercase">
            Find. Play.<br/>
            <span className="text-primary underline decoration-4 underline-offset-8">Win.</span>
          </h1>
          
          {/* Description */}
          <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed max-w-xl mx-auto md:mx-0 mb-8">
            America's fastest-growing premium pickleball platform. Join 12,400+ players competing in real-time tournaments.
          </p>
          
          {/* Secondary CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Organizers:</span>
            <Button variant="outline" className="rounded-full shadow-sm hover:border-primary hover:text-primary transition-colors bg-white font-bold" asChild>
              <Link to="/create-tournament">Host a Tournament (Free)</Link>
            </Button>
          </div>
        </div>

        {/* Search Card */}
        <div className="flex-1 w-full max-w-md bg-white rounded-2xl p-6 md:p-8 shadow-md border border-border">
          <form onSubmit={handleSearch} className="space-y-4">
            <h3 className="text-2xl font-display font-bold text-foreground mb-4 uppercase tracking-tight">Find an Event</h3>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Tournament name..." 
                  className="pl-10 h-12 bg-muted/30 border-border focus:bg-white transition-colors"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="City or zip code..." 
                  className="pl-10 h-12 bg-muted/30 border-border focus:bg-white transition-colors"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="relative">
                <Activity className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Select value={skill} onValueChange={setSkill}>
                  <SelectTrigger className="pl-10 h-12 bg-muted/30 border-border focus:bg-white transition-colors">
                    <SelectValue placeholder="Skill level (e.g. 3.5)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2.5">2.5 & Under</SelectItem>
                    <SelectItem value="3.0">3.0</SelectItem>
                    <SelectItem value="3.5">3.5</SelectItem>
                    <SelectItem value="4.0">4.0</SelectItem>
                    <SelectItem value="4.5">4.5</SelectItem>
                    <SelectItem value="5.0+">5.0+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full h-12 mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold text-lg uppercase tracking-wide">
              Find Tournaments →
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
