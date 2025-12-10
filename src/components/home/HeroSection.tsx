import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Calendar, ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 court-pattern opacity-30" />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/50 via-background to-background" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-secondary/20 blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-accent-foreground">
                Now hosting 500+ tournaments nationwide
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-tight">
              <span className="text-foreground">Host Epic</span>
              <br />
              <span className="text-gradient">Pickleball</span>
              <br />
              <span className="text-foreground">Tournaments</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-lg">
              The all-in-one platform for creating, managing, and participating in 
              pickleball tournaments. From pool play to championship brackets.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/tournaments">
                  Find Tournaments
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/create-tournament">
                  Host a Tournament
                </Link>
              </Button>
            </div>
            
            {/* Stats */}
            <div className="flex gap-8 pt-4">
              <div className="text-center">
                <div className="text-3xl font-display font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Tournaments</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-display font-bold text-primary">15K+</div>
                <div className="text-sm text-muted-foreground">Players</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-display font-bold text-primary">200+</div>
                <div className="text-sm text-muted-foreground">Organizers</div>
              </div>
            </div>
          </div>
          
          {/* Hero Visual */}
          <div className="relative hidden lg:block" style={{ animationDelay: "0.2s" }}>
            <div className="relative animate-fade-in">
              {/* Main Card */}
              <div className="bg-card rounded-2xl shadow-card-hover p-6 border border-border">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-hero-gradient flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">Summer Slam 2024</h3>
                    <p className="text-sm text-muted-foreground">Austin, TX</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">June 15-17, 2024</span>
                    </div>
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                      Open
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">128 / 256 Players</span>
                    </div>
                    <span className="text-xs text-muted-foreground">50% Full</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground">Events</div>
                      <div className="font-display font-bold text-primary">6</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground">Prize Pool</div>
                      <div className="font-display font-bold text-primary">$5,000</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-secondary text-secondary-foreground px-4 py-2 rounded-full font-display font-bold shadow-lg animate-bounce-subtle">
                🏆 Featured
              </div>
              
              {/* Mini Stats Card */}
              <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-xl shadow-card border border-border animate-fade-in" style={{ animationDelay: "0.4s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Active Now</div>
                    <div className="font-display font-bold text-foreground">2,847 Players</div>
                  </div>
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
