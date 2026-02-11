import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, Search, LayoutDashboard } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Hero Background Media */}
      <div className="absolute inset-0 z-0">
        <div 
          className="w-full h-full bg-cover bg-center" 
          style={{ 
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB2ro2JcsI0AMh_eL9MTuomWPeU3IQgjXOZ_lbWs-qOPERxZiZLY83Weh3gbaWQNBnCOGogw8yElfVNwR68dFrrgZnio0rE-UVUT2K_Rg9XFOmnV1qi2bkT6dwK9rIBOv6QCrqVACeOiuyM-s5dOR-hEGRPibWpzyEsBeKwh-k7FaEfReD8TnyXUYFghCsUDcNjoF7zbV2CNrReDImqTx0XsGDIBIHKK99tvuOPw5P-xeb6A_sNBgG9v2wWzcfmimu0vjp__1PVgpI')" 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background-dark/40 via-background-dark/60 to-background-dark/95" />
      </div>
      
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10 w-full">
        <div className="max-w-3xl">
          {/* Live Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-1.5 rounded-full mb-8 border border-primary/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-xs font-display font-black uppercase tracking-widest">Now Live: Summer Nationals</span>
          </div>
          
          {/* Headline */}
          <h1 className="text-white text-4xl sm:text-6xl md:text-8xl font-display font-black leading-[0.9] tracking-tighter mb-6 sm:mb-8 uppercase italic">
            Your Tournament, <br/>
            <span className="text-primary underline decoration-4 underline-offset-8">Perfected.</span>
          </h1>
          
          {/* Description */}
          <p className="text-slate-300 text-lg md:text-xl font-medium leading-relaxed max-w-2xl mb-12">
            Join the fastest-growing community in pickleball. From local bracket play to international championships, we provide the tools to compete, manage, and win.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="default" 
              size="lg" 
              className="px-10 py-5 bg-primary text-primary-foreground rounded-xl font-display font-black text-lg uppercase tracking-tighter hover:scale-105 transition-transform flex items-center gap-2"
              asChild
            >
              <Link to="/tournaments">
                Find a Tournament
                <Search className="w-5 h-5" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-10 py-5 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl font-display font-black text-lg uppercase tracking-tighter hover:bg-white/20 transition-all flex items-center gap-2"
              asChild
            >
              <Link to="/create-tournament">
                Organize Event
                <LayoutDashboard className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
