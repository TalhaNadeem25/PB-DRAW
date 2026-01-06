import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Calendar, ArrowRight, Star, Zap } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background mesh gradient */}
      <div className="absolute inset-0 bg-mesh-gradient" />
      
      {/* Court pattern overlay */}
      <div className="absolute inset-0 court-pattern-subtle opacity-40" />
      
      {/* Floating orbs */}
      <div className="absolute top-20 right-[10%] w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-float-slow" />
      <div className="absolute bottom-32 left-[5%] w-56 h-56 rounded-full bg-secondary/15 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-pulse-slow" />
      
      {/* Radial glow at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-glow-gradient opacity-50" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 animate-fade-in">
              <Zap className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-foreground">
                Now hosting <span className="text-primary font-bold">500+</span> tournaments nationwide
              </span>
            </div>
            
            {/* Headline */}
            <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1]">
                <span className="text-foreground">Host Epic</span>
                <br />
                <span className="text-gradient-shimmer">Pickleball</span>
                <br />
                <span className="text-foreground">Tournaments</span>
              </h1>
            </div>
            
            {/* Description */}
            <p className="text-lg text-muted-foreground max-w-lg animate-fade-in" style={{ animationDelay: "0.2s" }}>
              The all-in-one platform for creating, managing, and participating in 
              pickleball tournaments. From pool play to championship brackets.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Button variant="hero" size="xl" className="group shadow-glow hover:shadow-glow-lg transition-shadow" asChild>
                <Link to="/tournaments">
                  Find Tournaments
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" className="hover-lift" asChild>
                <Link to="/create-tournament">
                  Host a Tournament
                </Link>
              </Button>
            </div>
            
            {/* Stats */}
            <div className="flex gap-10 pt-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              {[
                { value: "500+", label: "Tournaments" },
                { value: "15K+", label: "Players" },
                { value: "200+", label: "Organizers" },
              ].map((stat, i) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-display font-bold text-primary">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
            
            {/* Trust badges */}
            <div className="flex items-center gap-4 pt-4 animate-fade-in" style={{ animationDelay: "0.5s" }}>
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div 
                    key={i} 
                    className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center"
                  >
                    <span className="text-xs font-medium text-muted-foreground">
                      {String.fromCharCode(64 + i)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
                  ))}
                </div>
                <span>Trusted by 15,000+ players</span>
              </div>
            </div>
          </div>
          
          {/* Hero Visual */}
          <div className="relative hidden lg:block">
            <div className="relative animate-fade-in" style={{ animationDelay: "0.3s" }}>
              {/* Main Card */}
              <div className="glass-card rounded-3xl p-8 hover-lift">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-glow">
                    <Trophy className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl">Summer Slam 2024</h3>
                    <p className="text-sm text-muted-foreground">Austin, TX</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-accent/50 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="font-medium">June 15-17, 2024</span>
                    </div>
                    <span className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full font-medium">
                      Open
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-accent/50 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="font-medium">128 / 256 Players</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="w-1/2 h-full bg-hero-gradient rounded-full" />
                      </div>
                      <span className="text-xs text-muted-foreground">50%</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="text-center p-4 bg-muted/50 rounded-xl">
                      <div className="text-xs text-muted-foreground mb-1">Events</div>
                      <div className="font-display font-bold text-2xl text-primary">6</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-xl">
                      <div className="text-xs text-muted-foreground mb-1">Prize Pool</div>
                      <div className="font-display font-bold text-2xl text-primary">$5,000</div>
                    </div>
                  </div>
                  
                  <Button variant="hero" className="w-full shadow-md hover:shadow-glow transition-shadow">
                    Register Now
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 px-5 py-2.5 rounded-full bg-secondary text-secondary-foreground font-display font-bold shadow-glow-yellow animate-bounce-gentle">
                <span className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Featured
                </span>
              </div>
              
              {/* Mini Stats Card */}
              <div className="absolute -bottom-6 -left-6 glass-card p-5 rounded-2xl animate-fade-in" style={{ animationDelay: "0.5s" }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Active Now</div>
                    <div className="font-display font-bold text-lg text-foreground">2,847 Players</div>
                  </div>
                </div>
              </div>
              
              {/* Live indicator */}
              <div className="absolute top-1/2 -right-8 glass p-4 rounded-xl animate-fade-in" style={{ animationDelay: "0.6s" }}>
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="text-sm font-medium">12 Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
